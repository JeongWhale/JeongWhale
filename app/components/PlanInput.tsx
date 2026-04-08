'use client';

import { ASPECT_RATIOS, type AspectRatio } from '@/app/lib/types';

interface PlanInputProps {
  planText: string;
  setPlanText: (s: string) => void;
  totalCards: number;
  setTotalCards: (n: number) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (a: AspectRatio) => void;
  disabled?: boolean;
}

export function PlanInput({
  planText,
  setPlanText,
  totalCards,
  setTotalCards,
  aspectRatio,
  setAspectRatio,
  disabled = false,
}: PlanInputProps) {
  return (
    <div className="plan-input">
      <label className="field">
        <span className="field__label">기획안 (Context + 디자인 요청사항)</span>
        <textarea
          className="field__textarea"
          rows={14}
          placeholder={`예시:

# 카드뉴스 주제: 신입 개발자를 위한 첫 PR 가이드

## 톤
친근하지만 신뢰감 있게. 파스텔 톤. 둥근 산세리프.

## 카드별 내용
1. (표지) 첫 PR이 두려운 당신에게
2. PR 전 체크리스트 3가지
3. 좋은 커밋 메시지 쓰는 법
4. 리뷰 코멘트 받았을 때 대응법
5. (마무리) 당신의 첫 PR을 응원합니다 — 팔로우!`}
          value={planText}
          onChange={(e) => setPlanText(e.target.value)}
          disabled={disabled}
        />
      </label>

      <div className="row">
        <label className="field field--inline">
          <span className="field__label">카드 수</span>
          <input
            className="field__number"
            type="number"
            min={1}
            max={10}
            value={totalCards}
            onChange={(e) =>
              setTotalCards(
                Math.max(1, Math.min(10, Number(e.target.value) || 1)),
              )
            }
            disabled={disabled}
          />
        </label>

        <label className="field field--inline">
          <span className="field__label">종횡비</span>
          <select
            className="field__select"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            disabled={disabled}
          >
            {ASPECT_RATIOS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
