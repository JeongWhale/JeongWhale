import { runJSON } from '../client';
import type { Provider, TopicCandidate } from '@/app/lib/types';

export async function topicIdeation(args: {
  provider: Provider;
  brandTone: string;
  direction?: string;
  count?: number;
}): Promise<TopicCandidate[]> {
  const count = Math.max(3, Math.min(12, args.count ?? 8));
  const out = await runJSON<{ candidates: TopicCandidate[] }>({
    provider: args.provider,
    schemaName: 'topicCandidates',
    schemaDescription: 'Instagram topic candidates aligned with brand tone.',
    schema: {
      type: 'object',
      required: ['candidates'],
      properties: {
        candidates: {
          type: 'array',
          items: {
            type: 'object',
            required: ['topic', 'angle', 'why'],
            properties: {
              topic: { type: 'string', description: '주제 (한 줄, 30자 이내)' },
              angle: { type: 'string', description: '접근 각도 (한 줄)' },
              why: { type: 'string', description: '왜 지금 이 주제가 통하는지 (한 줄)' },
            },
          },
        },
      },
    },
    system: [
      args.brandTone ? `<brand_tone>\n${args.brandTone}\n</brand_tone>\n` : '',
      '당신은 한국어 인스타그램 콘텐츠 기획자입니다.',
      '브랜드 톤에 맞춰 즉시 제작 가능한 주제 후보를 제안하세요.',
      '뻔한 주제(예: "○○하는 5가지 방법")는 피하고, 구체적이고 흥미로운 각도로.',
    ].join('\n'),
    user: [
      args.direction ? `사용자 방향성: ${args.direction}` : '사용자 방향성: (자유롭게)',
      `${count}개의 주제 후보를 제안해줘.`,
    ].join('\n'),
    maxOutputTokens: 2048,
  });
  return out.candidates.slice(0, count);
}
