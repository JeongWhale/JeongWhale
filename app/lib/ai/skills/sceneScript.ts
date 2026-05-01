import { runJSON } from '../client';
import type { Brief, Provider, ReelsScene } from '@/app/lib/types';

export async function sceneScript(args: {
  provider: Provider;
  brandTone: string;
  topic: string;
  brief: Brief;
  hookPrimary: string;
  durationSec: number;
}): Promise<ReelsScene[]> {
  const out = await runJSON<{ scenes: ReelsScene[] }>({
    provider: args.provider,
    schemaName: 'reelsSceneScript',
    schemaDescription: 'Per-scene reels script with timing.',
    schema: {
      type: 'object',
      required: ['scenes'],
      properties: {
        scenes: {
          type: 'array',
          items: {
            type: 'object',
            required: ['timeSec', 'voiceover', 'onScreenText', 'bRoll'],
            properties: {
              timeSec: {
                type: 'integer',
                description: '씬 시작 시점(초). 0부터 누적, 마지막 씬은 종료시간 이전.',
              },
              voiceover: { type: 'string', description: '내레이션/대사 (한국어)' },
              onScreenText: {
                type: 'string',
                description: '화면 자막 (15자 이내, 한국어)',
              },
              bRoll: {
                type: 'string',
                description: 'B-roll 또는 비주얼 지시 (촬영 가이드, 한국어)',
              },
              transition: {
                type: 'string',
                description: '다음 씬으로의 전환 (선택, 한국어)',
              },
            },
          },
        },
      },
    },
    system: [
      args.brandTone ? `<brand_tone>\n${args.brandTone}\n</brand_tone>\n` : '',
      '당신은 한국어 인스타그램 릴스 스크립트 작가입니다.',
      `${args.durationSec}초 분량으로 정확히 맞추세요. 첫 씬은 timeSec=0이며 제공된 hook으로 시작합니다.`,
      '4~7개의 씬으로 분할. 각 씬은 짧고 리듬감 있게.',
      '마지막 씬에 CTA 포함 (팔로우/저장/공유 등).',
    ].join('\n'),
    user: [
      `주제: ${args.topic}`,
      `총 길이: ${args.durationSec}초`,
      `훅(첫 씬 고정): "${args.hookPrimary}"`,
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
    maxOutputTokens: 2048,
  });

  // Sanitize: ensure timeSec monotonic and inside [0, duration].
  const sorted = [...out.scenes].sort((a, b) => a.timeSec - b.timeSec);
  return sorted.map((s, i) => ({
    timeSec: i === 0 ? 0 : Math.min(args.durationSec - 1, Math.max(s.timeSec, 0)),
    voiceover: s.voiceover,
    onScreenText: s.onScreenText,
    bRoll: s.bRoll,
    transition: s.transition,
  }));
}
