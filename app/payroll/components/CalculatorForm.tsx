'use client';

import type { MonthlyInput } from '../lib/types';
import { MoneyInput } from './MoneyInput';
import { MonthPicker } from './MonthPicker';

interface Props {
  value: MonthlyInput;
  onChange: (next: MonthlyInput) => void;
  disabled?: boolean;
}

export function CalculatorForm({ value, onChange, disabled }: Props) {
  const set = <K extends keyof MonthlyInput>(key: K, v: MonthlyInput[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div>
      <h2>1. 월 선택</h2>
      <div className="field">
        <label className="field__label" htmlFor="month">
          정산할 월
        </label>
        <MonthPicker
          id="month"
          value={value.month}
          onChange={(v) => set('month', v)}
          disabled={disabled}
        />
      </div>

      <h2>2. 매출 입력</h2>
      <div className="field">
        <label className="field__label" htmlFor="profile">
          프로필 사진 서비스 매출
        </label>
        <MoneyInput
          id="profile"
          value={value.profileRevenue}
          onChange={(v) => set('profileRevenue', v)}
          disabled={disabled}
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="fashion">
          패션 컨설팅 매출
        </label>
        <MoneyInput
          id="fashion"
          value={value.fashionRevenue}
          onChange={(v) => set('fashionRevenue', v)}
          disabled={disabled}
        />
      </div>

      <h2>3. 지출 & 프리랜서 작업</h2>
      <div className="field">
        <label className="field__label" htmlFor="card">
          카드 지출 (월 합계)
        </label>
        <MoneyInput
          id="card"
          value={value.cardExpense}
          onChange={(v) => set('cardExpense', v)}
          disabled={disabled}
        />
      </div>
      <div className="row">
        <div className="field field--inline">
          <label className="field__label" htmlFor="writer-count">
            작가 작업 건수
          </label>
          <input
            id="writer-count"
            type="number"
            min={0}
            className="field__number"
            disabled={disabled}
            value={value.writerJobCount || ''}
            onChange={(e) =>
              set('writerJobCount', Math.max(0, Number(e.target.value) || 0))
            }
          />
        </div>
        <div className="field field--inline">
          <label className="field__label" htmlFor="retoucher-count">
            보정관 작업 건수
          </label>
          <input
            id="retoucher-count"
            type="number"
            min={0}
            className="field__number"
            disabled={disabled}
            value={value.retoucherJobCount || ''}
            onChange={(e) =>
              set(
                'retoucherJobCount',
                Math.max(0, Number(e.target.value) || 0),
              )
            }
          />
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="memo">
          메모 (선택)
        </label>
        <textarea
          id="memo"
          className="field__textarea payroll-memo"
          disabled={disabled}
          placeholder="예: 이번 달 특이사항"
          value={value.memo ?? ''}
          onChange={(e) => set('memo', e.target.value)}
        />
      </div>
    </div>
  );
}
