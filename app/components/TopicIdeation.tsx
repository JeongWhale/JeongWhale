'use client';

import { useState } from 'react';
import type { Provider, TopicCandidate, TopicsResponse } from '@/app/lib/types';

interface Props {
  provider: Provider;
  brandId: string;
  brandToneVersion: string | null;
  topic: string;
  setTopic: (s: string) => void;
  disabled?: boolean;
}

export function TopicIdeation({
  provider,
  brandId,
  brandToneVersion,
  topic,
  setTopic,
  disabled,
}: Props) {
  const [direction, setDirection] = useState('');
  const [candidates, setCandidates] = useState<TopicCandidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSuggest = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider,
          brandId: brandId || undefined,
          brandToneVersion: brandToneVersion || undefined,
          direction: direction || undefined,
          count: 8,
        }),
      });
      const data = (await res.json()) as TopicsResponse;
      if (!data.ok) throw new Error(`${data.failedSkill ?? '?'}: ${data.error}`);
      setCandidates(data.candidates);
    } catch (e) {
      setError(e instanceof Error ? e.message : '추천 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="topic-ideation">
      <label className="field">
        <span className="field__label">방향성 (선택)</span>
        <input
          className="field__number"
          placeholder="예: 신규 팔로워 유입을 노린 시리즈"
          value={direction}
          onChange={(e) => setDirection(e.target.value.slice(0, 200))}
          disabled={disabled || busy}
        />
      </label>

      <div className="topic-ideation__row">
        <button
          type="button"
          onClick={onSuggest}
          disabled={disabled || busy}
        >
          {busy ? '추천 중…' : '주제 추천 받기'}
        </button>
      </div>

      {candidates.length > 0 && (
        <ul className="topic-list">
          {candidates.map((c, i) => {
            const selected = topic === c.topic;
            return (
              <li
                key={`${c.topic}-${i}`}
                className={`topic-list__item${selected ? ' topic-list__item--selected' : ''}`}
                onClick={() => setTopic(c.topic)}
              >
                <strong>{c.topic}</strong>
                <span className="topic-list__angle">{c.angle}</span>
                <span className="topic-list__why">{c.why}</span>
              </li>
            );
          })}
        </ul>
      )}

      <label className="field" style={{ marginTop: 12 }}>
        <span className="field__label">선택된 / 직접 입력한 주제</span>
        <input
          className="field__number"
          placeholder="추천에서 고르거나 직접 입력하세요"
          value={topic}
          onChange={(e) => setTopic(e.target.value.slice(0, 200))}
          disabled={disabled}
        />
      </label>

      {error && <div className="banner banner--error">{error}</div>}
    </div>
  );
}
