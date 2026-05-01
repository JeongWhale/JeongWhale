'use client';

import { useState } from 'react';
import type { ResearchApiResponse, ResearchResult } from '@/app/lib/types';

interface Props {
  topic: string;
  brandId: string;
  brandToneVersion: string | null;
  research: ResearchResult | null;
  setResearch: (r: ResearchResult | null) => void;
  disabled?: boolean;
}

export function ResearchView({
  topic,
  brandId,
  brandToneVersion,
  research,
  setResearch,
  disabled,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!topic.trim()) {
      setError('주제를 먼저 정해주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          topic,
          brandId: brandId || undefined,
          brandToneVersion: brandToneVersion || undefined,
        }),
      });
      const data = (await res.json()) as ResearchApiResponse;
      if (!data.ok) throw new Error(`${data.failedSkill ?? '?'}: ${data.error}`);
      setResearch(data.research);
    } catch (e) {
      setError(e instanceof Error ? e.message : '리서치 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="research-view">
      <div className="topic-ideation__row">
        <button
          type="button"
          onClick={run}
          disabled={disabled || busy || !topic.trim()}
        >
          {busy ? '딥리서치 중…' : '딥리서치 실행 (Gemini 그라운디드)'}
        </button>
        {research && (
          <button
            type="button"
            onClick={() => setResearch(null)}
            disabled={busy}
          >
            결과 비우기
          </button>
        )}
      </div>

      {research && (
        <div className="research-view__result">
          <h3>핵심 발견 ({research.findings.length})</h3>
          <ol className="research-view__findings">
            {research.findings.map((f, i) => (
              <li key={i}>
                <strong>{f.claim}</strong>
                <span> — {f.evidence}</span>
                {f.sourceIdx >= 0 && research.sources[f.sourceIdx] && (
                  <a
                    href={research.sources[f.sourceIdx].url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {' '}
                    [{f.sourceIdx + 1}]
                  </a>
                )}
              </li>
            ))}
          </ol>
          {research.sources.length > 0 && (
            <details>
              <summary>출처 ({research.sources.length})</summary>
              <ol>
                {research.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
      )}

      {error && <div className="banner banner--error">{error}</div>}
    </div>
  );
}
