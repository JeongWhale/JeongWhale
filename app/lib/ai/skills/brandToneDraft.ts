import { runJSON } from '../client';
import type { Provider } from '@/app/lib/types';

export interface BrandToneDraftInput {
  provider: Provider;
  brandName?: string;
  oneLiner?: string;
  audience?: string;
  speech?: 'casual' | 'polite' | 'mixed';
  vibe?: string;
  avoid?: string;
  samples?: string;
  existingBody?: string; // 기존 톤 문서가 있으면 개선 모드
}

export async function brandToneDraft(
  input: BrandToneDraftInput,
): Promise<{ markdown: string }> {
  const speechKr =
    input.speech === 'casual'
      ? '반말 / 친근한 구어체'
      : input.speech === 'polite'
        ? '존댓말 / 정중하고 부드럽게'
        : input.speech === 'mixed'
          ? '상황에 따라 혼합'
          : '(미지정)';

  const userParts = [
    input.existingBody
      ? `## 기존 톤 사전 (개선해줘)\n${input.existingBody}`
      : '',
    '## 사용자 입력 (Q&A)',
    `- 브랜드 한 줄: ${input.oneLiner || '(미입력)'}`,
    `- 브랜드명: ${input.brandName || '(미입력)'}`,
    `- 타겟: ${input.audience || '(미입력)'}`,
    `- 말투: ${speechKr}`,
    `- 분위기/무드: ${input.vibe || '(미입력)'}`,
    `- 피하고 싶은 것: ${input.avoid || '(미입력)'}`,
    '',
    '## 샘플 텍스트 (있으면 말투를 여기서 역추적)',
    input.samples?.trim() || '(없음)',
  ]
    .filter(Boolean)
    .join('\n');

  const out = await runJSON<{ markdown: string }>({
    provider: input.provider,
    schemaName: 'brandToneDraft',
    schemaDescription: 'A brand tone document drafted as markdown.',
    schema: {
      type: 'object',
      required: ['markdown'],
      properties: {
        markdown: {
          type: 'string',
          description:
            'Markdown 본문. 다음 섹션을 포함: ## 페르소나, ## 말투, ## 자주 쓰는 표현, ## 금기어, ## 타겟, ## 카피 예시 (3개). 한국어로 작성.',
        },
      },
    },
    system: [
      '당신은 브랜드 보이스 가이드 작성자입니다.',
      '입력된 Q&A와 샘플 텍스트를 바탕으로, 다른 LLM이 따라할 수 있는 명확한 톤 사전을 마크다운으로 작성하세요.',
      '샘플 텍스트가 있으면 그 안의 어미·문장 길이·이모지 사용·반복 표현을 분석해 "자주 쓰는 표현"에 반영.',
      '추측보단 입력에 근거. 입력이 비면 합리적 기본값을 명시적으로 표시 ("(미지정 — 보수적 존댓말 가정)" 같이).',
      '카피 예시는 짧은 인스타 캡션 형태로 3개 작성.',
      '결과는 markdown 한 필드에 전체 문서로 담아 반환.',
    ].join('\n'),
    user: userParts,
    maxOutputTokens: 3072,
  });

  return { markdown: out.markdown.trim() };
}
