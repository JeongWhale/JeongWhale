import { NextRequest, NextResponse } from 'next/server';
import { briefExpand } from '@/app/lib/ai/skills/briefExpand';
import { outlineCarousel } from '@/app/lib/ai/skills/outlineCarousel';
import { writeCard } from '@/app/lib/ai/skills/writeCard';
import { hookOptions } from '@/app/lib/ai/skills/hookOptions';
import { sceneScript } from '@/app/lib/ai/skills/sceneScript';
import { captionAndHashtags } from '@/app/lib/ai/skills/captionAndHashtags';
import { SkillError } from '@/app/lib/ai/client';
import { getEffectiveTone } from '@/app/lib/brandTone';
import { carouselToMarkdown } from '@/app/lib/planFormatter';
import type {
  CarouselPlan,
  PlanRequest,
  PlanResponse,
  ReelsPlan,
} from '@/app/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

function bad(error: string, status = 400, failedSkill?: string) {
  return NextResponse.json<PlanResponse>(
    { ok: false, error, failedSkill },
    { status },
  );
}

export async function POST(req: NextRequest) {
  let body: PlanRequest;
  try {
    body = (await req.json()) as PlanRequest;
  } catch {
    return bad('invalid json');
  }

  if (body.format !== 'carousel' && body.format !== 'reels') {
    return bad('format must be carousel or reels');
  }
  if (body.provider !== 'claude' && body.provider !== 'gemini') {
    return bad('provider must be claude or gemini');
  }
  if (typeof body.topic !== 'string' || body.topic.trim().length === 0) {
    return bad('topic is required');
  }
  if (body.topic.length > 200) return bad('topic too long');

  if (body.format === 'carousel') {
    if (
      !Number.isInteger(body.cardCount) ||
      (body.cardCount as number) < 1 ||
      (body.cardCount as number) > 10
    ) {
      return bad('cardCount must be 1..10');
    }
    if (!['1:1', '4:5', '9:16'].includes(body.aspectRatio ?? '')) {
      return bad('aspectRatio must be 1:1, 4:5, or 9:16');
    }
  } else {
    if (
      !Number.isInteger(body.durationSec) ||
      (body.durationSec as number) < 10 ||
      (body.durationSec as number) > 90
    ) {
      return bad('durationSec must be 10..90');
    }
  }

  const tone = await getEffectiveTone({
    brandId: body.brandId,
    versionId: body.brandToneVersion,
  });

  const research = body.research ?? null;
  const topic = body.topic.trim();

  let currentSkill = 'briefExpand';
  try {
    const brief = await briefExpand({
      provider: body.provider,
      brandTone: tone.body,
      topic,
      research,
    });

    if (body.format === 'carousel') {
      const cardCount = body.cardCount as number;

      currentSkill = 'outlineCarousel';
      const slots = await outlineCarousel({
        provider: body.provider,
        brandTone: tone.body,
        topic,
        brief,
        cardCount,
      });

      currentSkill = 'writeCard';
      const cards = await Promise.all(
        slots.map((slot) =>
          writeCard({
            provider: body.provider,
            brandTone: tone.body,
            topic,
            brief,
            slot,
            totalCards: cardCount,
          }),
        ),
      );

      currentSkill = 'captionAndHashtags';
      const summary = cards
        .map((c) => `[${c.index}/${c.role}] ${c.title} — ${c.bodyBullets.join(', ')}`)
        .join('\n');
      const ch = await captionAndHashtags({
        provider: body.provider,
        brandTone: tone.body,
        topic,
        brief,
        contentSummary: summary,
      });

      const partial: Omit<CarouselPlan, 'markdownPlan'> = {
        format: 'carousel',
        topic,
        brandToneVersion: tone.versionId,
        research,
        brief,
        cards,
        caption: ch.caption,
        hashtags: ch.hashtags,
      };
      const plan: CarouselPlan = {
        ...partial,
        markdownPlan: carouselToMarkdown(partial),
      };
      return NextResponse.json<PlanResponse>({ ok: true, plan });
    }

    // reels
    const durationSec = body.durationSec as number;
    currentSkill = 'hookOptions';
    const hook = await hookOptions({
      provider: body.provider,
      brandTone: tone.body,
      topic,
      brief,
    });

    currentSkill = 'sceneScript';
    const scenes = await sceneScript({
      provider: body.provider,
      brandTone: tone.body,
      topic,
      brief,
      hookPrimary: hook.primary,
      durationSec,
    });

    currentSkill = 'captionAndHashtags';
    const summary = scenes
      .map((s) => `${s.timeSec}s: ${s.onScreenText} | ${s.voiceover}`)
      .join('\n');
    const ch = await captionAndHashtags({
      provider: body.provider,
      brandTone: tone.body,
      topic,
      brief,
      contentSummary: summary,
    });

    const plan: ReelsPlan = {
      format: 'reels',
      topic,
      brandToneVersion: tone.versionId,
      research,
      brief,
      hook,
      scenes,
      caption: ch.caption,
      hashtags: ch.hashtags,
    };
    return NextResponse.json<PlanResponse>({ ok: true, plan });
  } catch (e) {
    const skill = e instanceof SkillError ? e.skill : currentSkill;
    return bad(e instanceof Error ? e.message : 'unknown', 500, skill);
  }
}
