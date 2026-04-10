const krw = new Intl.NumberFormat('ko-KR');

/** 1250000 → "1,250,000원". Negative values keep the minus sign. */
export function formatKRW(value: number): string {
  if (!Number.isFinite(value)) return '0원';
  return `${krw.format(Math.round(value))}원`;
}

/** 1250000 → "1,250,000" (no suffix — for table cells or money inputs). */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return krw.format(Math.round(value));
}

/** Strips commas/letters/whitespace; keeps digits and leading minus. */
export function parseKRW(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d-]/g, '');
  if (cleaned === '' || cleaned === '-') return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** '2026-03' → '2026년 3월' */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-');
  if (!y || !m) return month;
  return `${y}년 ${Number(m)}월`;
}

/** Today as 'YYYY-MM'. */
export function currentMonth(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}`;
}

/** Percentage helpers: 0.3 <-> 30. */
export function rateToPercent(rate: number): number {
  return Math.round(rate * 1000) / 10; // keep 1 decimal of precision
}
export function percentToRate(pct: number): number {
  return Math.max(0, Math.min(100, pct)) / 100;
}
