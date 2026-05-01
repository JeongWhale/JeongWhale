import { runJSON } from '../client';
import type { Brief, CarouselCard, Provider } from '@/app/lib/types';
import type { OutlineSlot } from './outlineCarousel';

export async function writeCard(args: {
  provider: Provider;
  brandTone: string;
  topic: string;
  brief: Brief;
  slot: OutlineSlot;
  totalCards: number;
}): Promise<CarouselCard> {
  const out = await runJSON<{
    title: string;
    bodyBullets: string[];
    visualCue: string;
  }>({
    provider: args.provider,
    schemaName: 'carouselCard',
    schemaDescription: 'A single carousel card.',
    schema: {
      type: 'object',
      required: ['title', 'bodyBullets', 'visualCue'],
      properties: {
        title: { type: 'string', description: '카드 타이틀 (15자 이내)' },
        bodyBullets: {
          type: 'array',
          items: { type: 'string' },
          description: '본문 불릿 1~4개, 각 25자 이내',
        },
        visualCue: {
          type: 'string',
          description: '이 카드에 어울리는 비주얼 디렉션 (한국어, 1~2문장)',
        },
      },
    },
    system: [
      args.brandTone ? `<brand_tone>\n${args.brandTone}\n</brand_tone>\n` : '',
      '당신은 인스타그램 캐러셀 카피라이터입니다.',
      '브랜드 톤을 정확히 따라 카드 한 장의 카피를 작성합니다.',
      '`bodyBullets`는 카드 위에 그대로 들어가는 텍스트입니다. 짧고 강하게.',
      '`visualCue`는 이미지 디자이너에게 줄 한국어 디렉션입니다. 사진/일러스트/타이포 중 무엇이 적절한지 명시.',
    ].join('\n'),
    user: [
      `주제: ${args.topic}`,
      `카드 위치: ${args.slot.index} / ${args.totalCards}`,
      `카드 역할: ${args.slot.role}`,
      `슬롯 헤드라인: ${args.slot.headline}`,
      '',
      '## 브리프',
      `핵심 인사이트: ${args.brief.keyInsights.join(' / ')}`,
      `각도: ${args.brief.angles.join(' / ')}`,
      `페인 포인트: ${args.brief.painPoints.join(' / ')}`,
      args.brief.doNotMention.length
        ? `금기: ${args.brief.doNotMention.join(' / ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
    maxOutputTokens: 1024,
  });

  return {
    index: args.slot.index,
    role: args.slot.role,
    title: out.title,
    bodyBullets: out.bodyBullets,
    visualCue: out.visualCue,
  };
}
