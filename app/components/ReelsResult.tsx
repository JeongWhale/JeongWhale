'use client';

import type { ReelsPlan } from '@/app/lib/types';
import { reelsToMarkdown } from '@/app/lib/planFormatter';

interface Props {
  plan: ReelsPlan;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ReelsResult({ plan }: Props) {
  const onCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const md = reelsToMarkdown(plan);

  return (
    <section className="reels-result">
      <header className="results__header">
        <h2>릴스 기획안</h2>
        <div className="results__meta">
          <button type="button" onClick={() => onCopy(md)}>
            전체 마크다운 복사
          </button>
          <a
            href={`data:text/markdown;charset=utf-8,${encodeURIComponent(md)}`}
            download={`reels-${plan.topic.replace(/[^A-Za-z0-9가-힣]/g, '_').slice(0, 40)}.md`}
          >
            .md 다운로드
          </a>
        </div>
      </header>

      <div className="reels-result__hook">
        <h3>훅</h3>
        <p>
          <strong>{plan.hook.primary}</strong>
        </p>
        {plan.hook.alternates.length > 0 && (
          <ul>
            {plan.hook.alternates.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}
      </div>

      <h3>씬 스크립트</h3>
      <ol className="scene-list">
        {plan.scenes.map((s, i) => (
          <li key={i} className="scene">
            <div className="scene__time">{fmtTime(s.timeSec)}</div>
            <div className="scene__body">
              <div>
                <strong>자막:</strong> {s.onScreenText}
              </div>
              <div>
                <strong>VO:</strong> {s.voiceover}
              </div>
              <div>
                <strong>B-roll:</strong> {s.bRoll}
              </div>
              {s.transition && (
                <div>
                  <strong>전환:</strong> {s.transition}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      <h3>캡션</h3>
      <pre className="reels-result__caption">{plan.caption}</pre>
      <button type="button" onClick={() => onCopy(plan.caption)}>
        캡션 복사
      </button>

      <h3>해시태그</h3>
      <p className="reels-result__hashtags">{plan.hashtags.join(' ')}</p>
      <button type="button" onClick={() => onCopy(plan.hashtags.join(' '))}>
        해시태그 복사
      </button>
    </section>
  );
}
