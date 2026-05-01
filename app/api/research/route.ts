import { NextRequest, NextResponse } from 'next/server';
import { deepResearch } from '@/app/lib/ai/grounded';
import { SkillError } from '@/app/lib/ai/client';
import { getEffectiveTone } from '@/app/lib/brandTone';
import type { ResearchApiResponse, ResearchRequest } from '@/app/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

function bad(error: string, status = 400, failedSkill?: string) {
  return NextResponse.json<ResearchApiResponse>(
    { ok: false, error, failedSkill },
    { status },
  );
}

export async function POST(req: NextRequest) {
  let body: ResearchRequest;
  try {
    body = (await req.json()) as ResearchRequest;
  } catch {
    return bad('invalid json');
  }

  if (typeof body.topic !== 'string' || body.topic.trim().length === 0) {
    return bad('topic is required');
  }
  if (body.topic.length > 200) return bad('topic too long');

  const tone = await getEffectiveTone({
    brandId: body.brandId,
    versionId: body.brandToneVersion,
  });

  try {
    const research = await deepResearch({
      topic: body.topic.trim(),
      brandTone: tone.body,
    });
    return NextResponse.json<ResearchApiResponse>({ ok: true, research });
  } catch (e) {
    const skill = e instanceof SkillError ? e.skill : 'deepResearch';
    return bad(e instanceof Error ? e.message : 'unknown', 500, skill);
  }
}
