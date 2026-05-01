import { runJSON } from '../client';
import type { Brief, Provider, ResearchResult } from '@/app/lib/types';

export async function briefExpand(args: {
  provider: Provider;
  brandTone: string;
  topic: string;
  research: ResearchResult | null;
}): Promise<Brief> {
  const researchBlock = args.research
    ? [
        '## 자료조사',
        ...args.research.findings.map((f, i) => {
          const src =
            f.sourceIdx >= 0 && args.research!.sources[f.sourceIdx]
              ? ` (출처: ${args.research!.sources[f.sourceIdx].url})`
              : '';
          return `${i + 1}. ${f.claim} — ${f.evidence}${src}`;
        }),
      ].join('\n')
    : '## 자료조사\n(없음)';

  return runJSON<Brief>({
    provider: args.provider,
    schemaName: 'brief',
    schemaDescription: 'Structured creative brief.',
    schema: {
      type: 'object',
      required: ['keyInsights', 'angles', 'painPoints', 'doNotMention'],
      properties: {
        keyInsights: {
          type: 'array',
          items: { type: 'string' },
          description: '리서치에서 도출된 3~5개 핵심 인사이트',
        },
        angles: {
          type: 'array',
          items: { type: 'string' },
          description: '콘텐츠가 취할 수 있는 2~4개 접근 각도',
        },
        painPoints: {
          type: 'array',
          items: { type: 'string' },
          description: '타겟의 페인 포인트 2~4개',
        },
        doNotMention: {
          type: 'array',
          items: { type: 'string' },
          description: '브랜드 톤상 피해야 할 요소 (없으면 빈 배열)',
        },
      },
    },
    system: [
      args.brandTone ? `<brand_tone>\n${args.brandTone}\n</brand_tone>\n` : '',
      '당신은 한국어 콘텐츠 전략가입니다. 입력된 자료와 브랜드 톤을 바탕으로 실행 가능한 크리에이티브 브리프를 작성하세요.',
      '추측이 아닌 자료에 기반해서, 구체적이고 짧게.',
    ].join('\n'),
    user: [`주제: ${args.topic}`, '', researchBlock].join('\n'),
    maxOutputTokens: 2048,
  });
}
