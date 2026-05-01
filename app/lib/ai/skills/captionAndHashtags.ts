import { runJSON } from '../client';
import type { Brief, Provider } from '@/app/lib/types';

export async function captionAndHashtags(args: {
  provider: Provider;
  brandTone: string;
  topic: string;
  brief: Brief;
  contentSummary: string; // 카드 헤드라인 모음 또는 씬 보이스오버 모음
}): Promise<{ caption: string; hashtags: string[] }> {
  const out = await runJSON<{ caption: string; hashtags: string[] }>({
    provider: args.provider,
    schemaName: 'captionAndHashtags',
    schemaDescription: 'Instagram caption and hashtags.',
    schema: {
      type: 'object',
      required: ['caption', 'hashtags'],
      properties: {
        caption: {
          type: 'string',
          description: '인스타그램 본문 (한국어, 80~250자, 줄바꿈 포함, CTA 1줄로 끝맺음)',
        },
        hashtags: {
          type: 'array',
          items: { type: 'string', description: '`#` 포함, 한국어 또는 영어' },
          description: '8~15개 해시태그',
        },
      },
    },
    system: [
      args.brandTone ? `<brand_tone>\n${args.brandTone}\n</brand_tone>\n` : '',
      '당신은 인스타그램 캡션·해시태그 작가입니다.',
      '캡션은 첫 줄로 후킹, 본문은 짧은 단락, 마지막 한 줄 CTA.',
      '해시태그는 톤에 맞고 검색 발견성이 좋은 조합으로.',
    ].join('\n'),
    user: [
      `주제: ${args.topic}`,
      '',
      '## 콘텐츠 요약',
      args.contentSummary,
      '',
      '## 브리프',
      `핵심 인사이트: ${args.brief.keyInsights.join(' / ')}`,
      `각도: ${args.brief.angles.join(' / ')}`,
    ].join('\n'),
    maxOutputTokens: 1024,
  });
  return {
    caption: out.caption,
    hashtags: out.hashtags
      .map((h) => (h.startsWith('#') ? h : `#${h}`))
      .slice(0, 15),
  };
}
