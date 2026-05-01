import { NextRequest, NextResponse } from 'next/server';
import { brandToneDraft } from '@/app/lib/ai/skills/brandToneDraft';
import { SkillError } from '@/app/lib/ai/client';
import type { Provider } from '@/app/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface DraftRequest {
  provider: Provider;
  brandName?: string;
  oneLiner?: string;
  audience?: string;
  speech?: 'casual' | 'polite' | 'mixed';
  vibe?: string;
  avoid?: string;
  samples?: string;
  existingBody?: string;
}

const MAX_SAMPLES = 20_000;
const MAX_FIELD = 500;

function bad(error: string, status = 400, failedSkill?: string) {
  return NextResponse.json(
    { ok: false, error, failedSkill },
    { status },
  );
}

export async function POST(req: NextRequest) {
  let body: DraftRequest;
  try {
    body = (await req.json()) as DraftRequest;
  } catch {
    return bad('invalid json');
  }

  if (body.provider !== 'claude' && body.provider !== 'gemini') {
    return bad('provider must be claude or gemini');
  }
  if (body.samples && body.samples.length > MAX_SAMPLES) {
    return bad(`samples too long (>${MAX_SAMPLES})`);
  }
  for (const k of ['brandName', 'oneLiner', 'audience', 'vibe', 'avoid'] as const) {
    if (body[k] && (body[k] as string).length > MAX_FIELD) {
      return bad(`${k} too long`);
    }
  }
  if (body.existingBody && body.existingBody.length > 50_000) {
    return bad('existingBody too long');
  }

  const hasAnyInput =
    Boolean(body.oneLiner) ||
    Boolean(body.audience) ||
    Boolean(body.vibe) ||
    Boolean(body.avoid) ||
    Boolean(body.samples) ||
    Boolean(body.existingBody);
  if (!hasAnyInput) {
    return bad('Q&A 또는 샘플 텍스트 중 하나는 입력해주세요.');
  }

  try {
    const { markdown } = await brandToneDraft(body);
    return NextResponse.json({ ok: true, markdown });
  } catch (e) {
    const skill = e instanceof SkillError ? e.skill : 'brandToneDraft';
    return bad(e instanceof Error ? e.message : 'unknown', 500, skill);
  }
}
