'use client';

import type { MonthlyInput, PayrollSettings } from '../lib/types';
import { MoneyInput } from './MoneyInput';
import { MonthPicker } from './MonthPicker';

interface Props {
  value: MonthlyInput;
  onChange: (next: MonthlyInput) => void;
  settings: PayrollSettings;
  disabled?: boolean;
}

export function CalculatorForm({
  value,
  onChange,
  settings,
  disabled,
}: Props) {
  const set = <K extends keyof MonthlyInput>(key: K, v: MonthlyInput[K]) =>
    onChange({ ...value, [key]: v });

  const setCard = (index: 0 | 1 | 2, amount: number) => {
    const next: [number, number, number] = [...value.cardExpenses] as [
      number,
      number,
      number,
    ];
    next[index] = amount;
    set('cardExpenses', next);
  };

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

      <h2>3. 카드 지출</h2>
      {[0, 1, 2].map((i) => {
        const idx = i as 0 | 1 | 2;
        return (
          <div className="field" key={idx}>
            <label className="field__label" htmlFor={`card-${idx}`}>
              {settings.cardLabels[idx]}
            </label>
            <MoneyInput
              id={`card-${idx}`}
              value={value.cardExpenses[idx] ?? 0}
              onChange={(v) => setCard(idx, v)}
              disabled={disabled}
            />
          </div>
        );
      })}
      <p className="payroll-hint">
        카드 이름은 설정 화면에서 자유롭게 바꿀 수 있습니다.
      </p>

      <h2>4. 프리랜서 작업</h2>
      <div className="field">
        <label className="field__label" htmlFor="writer-cost">
          작가 프리랜서 비용 (이번 달 총액)
        </label>
        <MoneyInput
          id="writer-cost"
          value={value.writerCost}
          onChange={(v) => set('writerCost', v)}
          disabled={disabled}
        />
        <p className="payroll-hint">
          서비스별 단가가 달라 이번 달 실제 지급액을 직접 입력합니다.
        </p>
      </div>
      <div className="row">
        <div className="field field--inline">
          <label className="field__label" htmlFor="main-retoucher-count">
            메인 보정가 건수
          </label>
          <input
            id="main-retoucher-count"
            type="number"
            min={0}
            className="field__number"
            disabled={disabled}
            value={value.mainRetoucherJobCount || ''}
            onChange={(e) =>
              set(
                'mainRetoucherJobCount',
                Math.max(0, Number(e.target.value) || 0),
              )
            }
          />
        </div>
        <div className="field field--inline">
          <label className="field__label" htmlFor="sub-retoucher-count">
            보조 보정가 건수
          </label>
          <input
            id="sub-retoucher-count"
            type="number"
            min={0}
            className="field__number"
            disabled={disabled}
            value={value.subRetoucherJobCount || ''}
            onChange={(e) =>
              set(
                'subRetoucherJobCount',
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
