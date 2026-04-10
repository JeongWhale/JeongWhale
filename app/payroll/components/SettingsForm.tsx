'use client';

import { useState } from 'react';
import { percentToRate, rateToPercent } from '../lib/format';
import { saveSettings } from '../lib/storage';
import type { PayrollSettings } from '../lib/types';
import { MoneyInput } from './MoneyInput';

interface Props {
  initial: PayrollSettings;
  onSaved?: (next: PayrollSettings) => void;
}

export function SettingsForm({ initial, onSaved }: Props) {
  const [draft, setDraft] = useState<PayrollSettings>(initial);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const set = <K extends keyof PayrollSettings>(
    key: K,
    value: PayrollSettings[K],
  ) => setDraft({ ...draft, [key]: value });

  const setCardLabel = (index: 0 | 1 | 2, label: string) => {
    const next: [string, string, string] = [...draft.cardLabels] as [
      string,
      string,
      string,
    ];
    next[index] = label;
    set('cardLabels', next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = saveSettings(draft);
    setDraft(saved);
    setSavedAt(new Date().toLocaleTimeString('ko-KR'));
    onSaved?.(saved);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>카드 이름</h2>
      {[0, 1, 2].map((i) => {
        const idx = i as 0 | 1 | 2;
        return (
          <div className="field" key={idx}>
            <label
              className="field__label"
              htmlFor={`card-label-${idx}`}
            >
              카드 {idx + 1} 이름
            </label>
            <input
              id={`card-label-${idx}`}
              type="text"
              className="field__number"
              value={draft.cardLabels[idx]}
              placeholder={`카드 ${idx + 1}`}
              onChange={(e) => setCardLabel(idx, e.target.value)}
            />
          </div>
        );
      })}

      <h2>보정가 단가</h2>
      <div className="field">
        <label className="field__label" htmlFor="main-retoucher-rate">
          메인 보정가 건당 단가
        </label>
        <MoneyInput
          id="main-retoucher-rate"
          value={draft.mainRetoucherRatePerJob}
          onChange={(v) => set('mainRetoucherRatePerJob', v)}
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="sub-retoucher-rate">
          보조 보정가 건당 단가
        </label>
        <MoneyInput
          id="sub-retoucher-rate"
          value={draft.subRetoucherRatePerJob}
          onChange={(v) => set('subRetoucherRatePerJob', v)}
        />
      </div>

      <h2>CS 프리랜서</h2>
      <div className="field">
        <label className="field__label" htmlFor="cs-salary">
          CS 월 고정 급여
        </label>
        <MoneyInput
          id="cs-salary"
          value={draft.csMonthlySalary}
          onChange={(v) => set('csMonthlySalary', v)}
        />
        <p className="payroll-hint">
          작가 프리랜서는 서비스별 단가가 달라 계산기에서 월 총액을 직접
          입력합니다.
        </p>
      </div>

      <h2>직원 분배</h2>
      <div className="field">
        <label className="field__label" htmlFor="share-rate">
          영업이익 분배 비율 (%)
        </label>
        <input
          id="share-rate"
          type="number"
          min={0}
          max={100}
          step={0.1}
          className="field__number"
          value={rateToPercent(draft.employeeProfitShareRate)}
          onChange={(e) =>
            set(
              'employeeProfitShareRate',
              percentToRate(Number(e.target.value) || 0),
            )
          }
        />
        <p className="payroll-hint">
          기본 30%. 영업이익이 음수일 때는 0원으로 계산됩니다.
        </p>
      </div>

      <button type="submit" className="generate-btn">
        설정 저장
      </button>

      {savedAt ? (
        <div className="banner payroll-banner--success">
          {savedAt}에 저장되었습니다.
        </div>
      ) : null}
    </form>
  );
}
