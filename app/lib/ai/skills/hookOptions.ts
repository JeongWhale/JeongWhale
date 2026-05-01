import { runJSON } from '../client';
import type { Brief, Provider, ReelsHook } from '@/app/lib/types';

export async function hookOptions(args: {
  provider: Provider;
  brandTone: string;
  topic: string;
  brief: Brief;
}): Promise<ReelsHook> {
  const out = await runJSON<{ primary: string; alternates: string[] }>({
    provider: args.provider,
    schemaName: 'reelsHook',
    schemaDescription: 'Reels opening hook (first ~3 seconds).',
    schema: {
      type: 'object',
      required: ['primary', 'alternates'],
      properties: {
        primary: {
          type: 'string',
          description: '가장 강한 후킹 한 줄 (한국어, 20자 이내, 첫 3초용)',
        },
        alternates: {
          type: 'array',
          items: { type: 'string' },
          description: '대안 후킹 2개 (각 20자 이내)',
        },
      },
    },
    system: [
      args.brandTone ? `<brand_tone>\n${args.brandTone}\n</brand_tone>\n` : '',
      '당신은 인스타그램 릴스의 후킹(첫 3초) 전문가입니다.',
      '스크롤을 멈추게 하는 충돌, 의문, 숫자, 반전 중 하나 이상을 사용하세요.',
      '클리셰("여러분 안녕하세요" 등) 금지.',
    ].join('\n'),
    user: [
      `주제: ${args.topic}`,
      '',
      '## 브리프',
      `핵심 인사이트: ${args.brief.keyInsights.join(' / ')}`,
      `각도: ${args.brief.angles.join(' / ')}`,
      `페인 포인트: ${args.brief.painPoints.join(' / ')}`,
    ].join('\n'),
    maxOutputTokens: 512,
  });
  return { primary: out.primary, alternates: out.alternates.slice(0, 2) };
}
