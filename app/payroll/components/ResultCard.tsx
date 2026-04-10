'use client';

import { formatKRW, formatMonth, rateToPercent } from '../lib/format';
import type {
  CalculationResult,
  MonthlyInput,
  PayrollSettings,
} from '../lib/types';

interface Props {
  month: string;
  input: MonthlyInput;
  settings: PayrollSettings;
  result: CalculationResult;
  /** When true, renders with a light theme for printing/PDF. */
  printMode?: boolean;
  /** Node id used by the PDF exporter to find the printable area. */
  printId?: string;
}

export function ResultCard({
  month,
  input,
  settings,
  result,
  printMode,
  printId,
}: Props) {
  const negative = result.operatingProfit < 0;
  const rate = rateToPercent(settings.employeeProfitShareRate);

  return (
    <div
      id={printId}
      className={
        printMode ? 'payroll-result payroll-result--print' : 'payroll-result'
      }
    >
      <div className="payroll-result__header">
        <div className="payroll-result__title">{formatMonth(month)} 정산</div>
        <div className="payroll-result__subtitle">
          프로필 사진 · 패션 컨설팅
        </div>
      </div>

      <Row label="프로필 사진 매출" value={input.profileRevenue} />
      <Row label="패션 컨설팅 매출" value={input.fashionRevenue} />
      <Row label="총 매출" value={result.totalRevenue} variant="sum" />

      <Divider />

      <Row label="− 카드 지출" value={-input.cardExpense} />
      <Row
        label={`− 작가 비용 (${input.writerJobCount}건 × ${formatKRW(
          settings.writerRatePerJob,
        )})`}
        value={-result.writerCost}
      />
      <Row
        label={`− 보정관 비용 (${input.retoucherJobCount}건 × ${formatKRW(
          settings.retoucherRatePerJob,
        )})`}
        value={-result.retoucherCost}
      />
      <Row label="− CS 고정 급여" value={-result.csCost} />

      <Divider />

      <Row
        label="영업이익"
        value={result.operatingProfit}
        variant={negative ? 'negative' : 'sum'}
      />
      <Row
        label={`− 직원 분배 (${rate}%)`}
        value={-result.employeeShare}
      />
      <Row
        label="사업주 순이익"
        value={result.ownerNetProfit}
        variant="profit"
      />

      {input.memo ? (
        <div className="payroll-result__memo">
          <div className="payroll-result__memo-label">메모</div>
          <div className="payroll-result__memo-body">{input.memo}</div>
        </div>
      ) : null}

      <div className="payroll-result__footer">
        설정 스냅샷 · 작가 {formatKRW(settings.writerRatePerJob)}/건 · 보정관{' '}
        {formatKRW(settings.retoucherRatePerJob)}/건 · CS{' '}
        {formatKRW(settings.csMonthlySalary)} · 직원 분배 {rate}%
      </div>
    </div>
  );
}

type Variant = 'sum' | 'profit' | 'negative';

function Row({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: Variant;
}) {
  const className =
    'payroll-result__row' +
    (variant ? ` payroll-result__row--${variant}` : '');
  return (
    <div className={className}>
      <div className="payroll-result__label">{label}</div>
      <div className="payroll-money">{formatKRW(value)}</div>
    </div>
  );
}

function Divider() {
  return <div className="payroll-result__divider" />;
}
