'use client';

import { useEffect, useState } from 'react';
import { formatNumber, parseKRW } from '../lib/format';

interface Props {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  min?: number;
}

export function MoneyInput({
  value,
  onChange,
  disabled,
  placeholder,
  id,
  min = 0,
}: Props) {
  const [text, setText] = useState<string>(() =>
    value ? formatNumber(value) : '',
  );

  // Sync external value changes (e.g. loading a saved record).
  useEffect(() => {
    const parsed = parseKRW(text);
    if (parsed !== value) {
      setText(value ? formatNumber(value) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="payroll-money-input">
      <input
        id={id}
        className="field__number payroll-money-input__input"
        type="text"
        inputMode="numeric"
        disabled={disabled}
        placeholder={placeholder ?? '0'}
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          const n = parseKRW(raw);
          const clamped = min !== undefined ? Math.max(min, n) : n;
          setText(clamped ? formatNumber(clamped) : raw === '' ? '' : '0');
          onChange(clamped);
        }}
      />
      <span className="payroll-money-input__suffix">원</span>
    </div>
  );
}
