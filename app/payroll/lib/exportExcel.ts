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
    ['지출 / 프리랜서', '금액 (원)'],
    ['카드 지출', input.cardExpense],
    [`작가 비용 (${input.writerJobCount}건 × ${s.writerRatePerJob}원)`, result.writerCost],
    [
      `보정관 비용 (${input.retoucherJobCount}건 × ${s.retoucherRatePerJob}원)`,
      result.retoucherCost,
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
