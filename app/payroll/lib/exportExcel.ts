import * as XLSX from 'xlsx';
import { formatMonth, rateToPercent } from './format';
import type { MonthlyRecord } from './types';

/**
 * Writes a single-sheet .xlsx file for the given monthly record and triggers
 * a browser download.
 *
 * Note: we only *write* xlsx files and never parse untrusted ones, so the
 * known SheetJS ReDoS / prototype pollution advisories don't apply here.
 */
export function exportMonthToXlsx(record: MonthlyRecord): void {
  const { input, result, settingsSnapshot: s } = record;
  const ratePct = rateToPercent(s.employeeProfitShareRate);

  const rows: (string | number)[][] = [
    ['JeongWhale 월 정산서', ''],
    ['대상 월', formatMonth(record.month)],
    ['저장 일시', new Date(record.savedAt).toLocaleString('ko-KR')],
    ['', ''],
    ['매출', '금액 (원)'],
    ['프로필 사진 매출', input.profileRevenue],
    ['패션 컨설팅 매출', input.fashionRevenue],
    ['총 매출', result.totalRevenue],
    ['', ''],
    ['카드 지출', '금액 (원)'],
    [s.cardLabels[0], input.cardExpenses[0] ?? 0],
    [s.cardLabels[1], input.cardExpenses[1] ?? 0],
    [s.cardLabels[2], input.cardExpenses[2] ?? 0],
    ['카드 지출 합계', result.cardExpenseTotal],
    ['', ''],
    ['프리랜서 비용', '금액 (원)'],
    ['작가 프리랜서 비용 (월 총액)', result.writerCost],
    [
      `메인 보정가 (${input.mainRetoucherJobCount}건 × ${s.mainRetoucherRatePerJob}원)`,
      result.mainRetoucherCost,
    ],
    [
      `보조 보정가 (${input.subRetoucherJobCount}건 × ${s.subRetoucherRatePerJob}원)`,
      result.subRetoucherCost,
    ],
    ['CS 고정 급여', result.csCost],
    ['프리랜서 총비용', result.freelancerTotalCost],
    ['', ''],
    ['결과', '금액 (원)'],
    ['영업이익', result.operatingProfit],
    [`직원 분배 (${ratePct}%)`, result.employeeShare],
    ['사업주 순이익', result.ownerNetProfit],
  ];

  if (input.memo) {
    rows.push(['', '']);
    rows.push(['메모', input.memo]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 38 }, { wch: 20 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${record.month}`);
  XLSX.writeFile(wb, `정산_${record.month}.xlsx`);
}
