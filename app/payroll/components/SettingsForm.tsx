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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = saveSettings(draft);
    setDraft(saved);
    setSavedAt(new Date().toLocaleTimeString('ko-KR'));
    onSaved?.(saved);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>프리랜서 단가</h2>
      <div className="field">
        <label className="field__label" htmlFor="writer-rate">
          작가 건당 단가
        </label>
        <MoneyInput
          id="writer-rate"
          value={draft.writerRatePerJob}
          onChange={(v) => set('writerRatePerJob', v)}
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="retoucher-rate">
          보정관 건당 단가
        </label>
        <MoneyInput
          id="retoucher-rate"
          value={draft.retoucherRatePerJob}
          onChange={(v) => set('retoucherRatePerJob', v)}
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="cs-salary">
          CS 월 고정 급여
        </label>
        <MoneyInput
          id="cs-salary"
          value={draft.csMonthlySalary}
          onChange={(v) => set('csMonthlySalary', v)}
        />
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
