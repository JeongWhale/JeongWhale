import type {
  CarouselCard,
  CarouselPlan,
  ReelsPlan,
  ResearchResult,
} from './types';

function researchSection(r: ResearchResult | null): string {
  if (!r || r.findings.length === 0) return '';
  const lines = ['## 자료조사 요약'];
  for (const f of r.findings) {
    const src = f.sourceIdx >= 0 ? ` [${f.sourceIdx + 1}]` : '';
    lines.push(`- ${f.claim}${src} — ${f.evidence}`);
  }
  if (r.sources.length > 0) {
    lines.push('');
    lines.push('### 출처');
    r.sources.forEach((s, i) => lines.push(`[${i + 1}] ${s.title} — ${s.url}`));
  }
  return lines.join('\n');
}

function cardSection(card: CarouselCard): string {
  const roleKr = card.role === 'hook' ? '표지' : card.role === 'cta' ? '마무리' : '본문';
  return [
    `### ${card.index}. ${card.title} _(${roleKr})_`,
    ...card.bodyBullets.map((b) => `- ${b}`),
    '',
    `**비주얼:** ${card.visualCue}`,
  ].join('\n');
}

export function carouselToMarkdown(p: Omit<CarouselPlan, 'markdownPlan'>): string {
  const sections = [
    `# 카드뉴스: ${p.topic}`,
    '',
    '## 브리프',
    `- 핵심 인사이트: ${p.brief.keyInsights.join(' / ')}`,
    `- 접근 각도: ${p.brief.angles.join(' / ')}`,
    `- 페인 포인트: ${p.brief.painPoints.join(' / ')}`,
    p.brief.doNotMention.length
      ? `- 금기: ${p.brief.doNotMention.join(' / ')}`
      : '',
    '',
    researchSection(p.research),
    researchSection(p.research) ? '' : '',
    '## 카드별 내용',
    ...p.cards.map(cardSection),
    '',
    '## 캡션',
    p.caption,
    '',
    '## 해시태그',
    p.hashtags.join(' '),
  ].filter(Boolean);
  return sections.join('\n');
}

export function reelsToMarkdown(p: ReelsPlan): string {
  const sceneLines = p.scenes
    .map((s) => {
      const t = `${String(Math.floor(s.timeSec / 60)).padStart(2, '0')}:${String(s.timeSec % 60).padStart(2, '0')}`;
      return [
        `### ${t}`,
        `- 자막: ${s.onScreenText}`,
        `- 보이스오버: ${s.voiceover}`,
        `- B-roll: ${s.bRoll}`,
        s.transition ? `- 전환: ${s.transition}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  return [
    `# 릴스: ${p.topic}`,
    '',
    '## 훅',
    `- 메인: ${p.hook.primary}`,
    ...p.hook.alternates.map((a) => `- 대안: ${a}`),
    '',
    '## 브리프',
    `- 핵심 인사이트: ${p.brief.keyInsights.join(' / ')}`,
    `- 접근 각도: ${p.brief.angles.join(' / ')}`,
    `- 페인 포인트: ${p.brief.painPoints.join(' / ')}`,
    '',
    researchSection(p.research),
    '',
    '## 씬 스크립트',
    sceneLines,
    '',
    '## 캡션',
    p.caption,
    '',
    '## 해시태그',
    p.hashtags.join(' '),
  ]
    .filter((s) => s !== null && s !== undefined)
    .join('\n');
}
