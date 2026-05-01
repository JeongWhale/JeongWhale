import { NextRequest, NextResponse } from 'next/server';
import { topicIdeation } from '@/app/lib/ai/skills/topicIdeation';
import { SkillError } from '@/app/lib/ai/client';
import { getEffectiveTone } from '@/app/lib/brandTone';
import type { TopicsRequest, TopicsResponse } from '@/app/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

function bad(error: string, status = 400, failedSkill?: string) {
  return NextResponse.json<TopicsResponse>(
    { ok: false, error, failedSkill },
    { status },
  );
}

export async function POST(req: NextRequest) {
  let body: TopicsRequest;
  try {
    body = (await req.json()) as TopicsRequest;
  } catch {
    return bad('invalid json');
  }

  if (body.provider !== 'claude' && body.provider !== 'gemini') {
    return bad('provider must be claude or gemini');
  }
  if (body.direction && body.direction.length > 500) {
    return bad('direction too long');
  }

  const tone = await getEffectiveTone({
    brandId: body.brandId,
    versionId: body.brandToneVersion,
  });

  try {
    const candidates = await topicIdeation({
      provider: body.provider,
      brandTone: tone.body,
      direction: body.direction,
      count: body.count,
    });
    return NextResponse.json<TopicsResponse>({ ok: true, candidates });
  } catch (e) {
    const skill = e instanceof SkillError ? e.skill : 'topicIdeation';
    return bad(e instanceof Error ? e.message : 'unknown', 500, skill);
  }
}
