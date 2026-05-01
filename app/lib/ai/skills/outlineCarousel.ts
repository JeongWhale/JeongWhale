import { runJSON } from '../client';
import type { Brief, Provider } from '@/app/lib/types';

export interface OutlineSlot {
  index: number;
  role: 'hook' | 'body' | 'cta';
  headline: string;
}

export async function outlineCarousel(args: {
  provider: Provider;
  brandTone: string;
  topic: string;
  brief: Brief;
  cardCount: number;
}): Promise<OutlineSlot[]> {
  const out = await runJSON<{ slots: OutlineSlot[] }>({
    provider: args.provider,
    schemaName: 'carouselOutline',
    schemaDescription: 'Carousel slot outline.',
    schema: {
      type: 'object',
      required: ['slots'],
      properties: {
        slots: {
          type: 'array',
          items: {
            type: 'object',
            required: ['index', 'role', 'headline'],
            properties: {
              index: { type: 'integer' },
              role: { type: 'string', enum: ['hook', 'body', 'cta'] },
              headline: { type: 'string', description: '카드 한 줄 헤드라인' },
            },
          },
        },
      },
    },
    system: [
      args.brandTone ? `<brand_tone>\n${args.brandTone}\n</brand_tone>\n` : '',
      '당신은 인스타그램 캐러셀 구조 설계자입니다.',
      `정확히 ${args.cardCount}장의 카드 슬롯을 설계하세요. 1번은 항상 hook, 마지막은 항상 cta.`,
      '각 헤드라인은 25자 이내로 강렬하게.',
    ].join('\n'),
    user: [
      `주제: ${args.topic}`,
      `카드 수: ${args.cardCount}`,
      '',
      '## 브리프',
      `핵심 인사이트: ${args.brief.keyInsights.join(' / ')}`,
      `각도: ${args.brief.angles.join(' / ')}`,
      `페인 포인트: ${args.brief.painPoints.join(' / ')}`,
    ].join('\n'),
    maxOutputTokens: 1536,
  });

  // Enforce length and role rules.
  const slots = out.slots.slice(0, args.cardCount).map((s, i) => ({
    index: i + 1,
    role:
      i === 0
        ? ('hook' as const)
        : i === args.cardCount - 1
          ? ('cta' as const)
          : ('body' as const),
    headline: s.headline,
  }));
  while (slots.length < args.cardCount) {
    slots.push({
      index: slots.length + 1,
      role:
        slots.length === args.cardCount - 1 ? 'cta' : 'body',
      headline: '추가 포인트',
    });
  }
  return slots;
}
