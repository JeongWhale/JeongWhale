import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buildCardPrompt } from '@/app/lib/prompt';
import type {
  GenerateRequest,
  GenerateResponse,
} from '@/app/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MODEL_ID = 'gemini-3-pro-image-preview';
const MAX_TEMPLATES = 5;
const MAX_TOTAL_CARDS = 10;
const MAX_PLAN_LEN = 20_000;
const MAX_RETRIES = 2;

function bad(error: string, cardIndex = 0, status = 400) {
  return NextResponse.json<GenerateResponse>(
    { ok: false, cardIndex, error },
    { status },
  );
}

function isFsSafeSessionId(s: string): boolean {
  return /^[A-Za-z0-9._-]{1,128}$/.test(s);
}

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return bad('GEMINI_API_KEY is not set in .env.local', 0, 500);
  }

  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return bad('invalid json body');
  }

  const {
    sessionId,
    cardIndex,
    totalCards,
    aspectRatio,
    planText,
    templates,
  } = body ?? ({} as GenerateRequest);

  // ---- Validation ---------------------------------------------------------
  if (!sessionId || !isFsSafeSessionId(sessionId)) {
    return bad('invalid sessionId');
  }
  if (
    !Number.isInteger(cardIndex) ||
    cardIndex < 1 ||
    cardIndex > MAX_TOTAL_CARDS
  ) {
    return bad(`cardIndex must be 1..${MAX_TOTAL_CARDS}`);
  }
  if (
    !Number.isInteger(totalCards) ||
    totalCards < 1 ||
    totalCards > MAX_TOTAL_CARDS ||
    cardIndex > totalCards
  ) {
    return bad(`totalCards must be 1..${MAX_TOTAL_CARDS} and >= cardIndex`);
  }
  if (!['1:1', '4:5', '9:16'].includes(aspectRatio)) {
    return bad('aspectRatio must be 1:1, 4:5, or 9:16');
  }
  if (typeof planText !== 'string' || planText.trim().length === 0) {
    return bad('planText is required');
  }
  if (planText.length > MAX_PLAN_LEN) {
    return bad(`planText too long (>${MAX_PLAN_LEN} chars)`);
  }
  if (!Array.isArray(templates) || templates.length === 0) {
    return bad('at least one template image is required');
  }
  if (templates.length > MAX_TEMPLATES) {
    return bad(`too many templates (max ${MAX_TEMPLATES})`);
  }
  for (const t of templates) {
    if (
      !t ||
      !t.base64 ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(t.mimeType)
    ) {
      return bad('template entries must have base64 + supported mimeType');
    }
  }

  // ---- Prepare output dir -------------------------------------------------
  const outDir = path.join(process.cwd(), 'outputs', sessionId);
  await fs.mkdir(outDir, { recursive: true });

  if (cardIndex === 1) {
    const planSnapshot =
      `aspectRatio: ${aspectRatio}\n` +
      `totalCards: ${totalCards}\n` +
      `model: ${MODEL_ID}\n` +
      `createdAt: ${new Date().toISOString()}\n\n` +
      planText +
      '\n';
    await fs.writeFile(path.join(outDir, 'plan.txt'), planSnapshot, 'utf8');
  }

  // ---- Build multimodal request ------------------------------------------
  const promptText = buildCardPrompt({
    planText,
    cardIndex,
    totalCards,
    aspectRatio,
  });

  const parts = [
    ...templates.map((t) => ({
      inlineData: { mimeType: t.mimeType, data: t.base64 },
    })),
    { text: promptText },
  ];

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // ---- Call model with retry ---------------------------------------------
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await ai.models.generateContent({
        model: MODEL_ID,
        contents: [{ role: 'user', parts }],
        config: {
          responseModalities: ['IMAGE'],
        },
      });

      const candidate = resp.candidates?.[0];
      const responseParts = candidate?.content?.parts ?? [];
      const imgPart = responseParts.find(
        (p) => p.inlineData?.data && p.inlineData?.mimeType?.startsWith('image/'),
      );

      if (!imgPart?.inlineData?.data) {
        // Try to surface a useful error: refusal text or blockReason
        const textPart = responseParts.find((p) => p.text)?.text;
        const blockReason = resp.promptFeedback?.blockReason;
        const blockMsg = resp.promptFeedback?.blockReasonMessage;
        const finishReason = candidate?.finishReason;
        const msg =
          textPart ||
          blockMsg ||
          (blockReason ? `blocked: ${blockReason}` : '') ||
          (finishReason ? `finishReason: ${finishReason}` : '') ||
          'no image returned by model';
        throw new Error(msg);
      }

      const base64 = imgPart.inlineData.data;
      const fname = `card-${String(cardIndex).padStart(2, '0')}.png`;
      const filePath = path.join(outDir, fname);
      await fs.writeFile(filePath, Buffer.from(base64, 'base64'));

      const relPath = path.posix.join('outputs', sessionId, fname);
      return NextResponse.json<GenerateResponse>({
        ok: true,
        cardIndex,
        relPath,
        imageBase64: base64,
        mimeType: 'image/png',
      });
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }

  const errMsg =
    lastErr instanceof Error ? lastErr.message : String(lastErr ?? 'unknown error');
  return NextResponse.json<GenerateResponse>(
    { ok: false, cardIndex, error: errMsg },
    { status: 500 },
  );
}
