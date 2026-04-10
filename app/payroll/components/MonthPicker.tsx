'use client';

interface Props {
  value: string; // 'YYYY-MM'
  onChange: (next: string) => void;
  disabled?: boolean;
  id?: string;
}

export function MonthPicker({ value, onChange, disabled, id }: Props) {
  return (
    <input
      id={id}
      type="month"
      className="field__number"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
