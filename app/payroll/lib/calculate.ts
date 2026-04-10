import type { CalculationResult, MonthlyInput, PayrollSettings } from './types';

const r = (n: number): number => Math.round(n);
const n = (v: number): number => (Number.isFinite(v) ? v : 0);

/**
 * Pure calculation — given monthly inputs and active settings, returns the
 * full breakdown. Safe with partially-filled forms (NaN/undefined → 0).
 * Negative operating profit does NOT charge the 30% employee.
 */
export function calculatePayroll(
  input: MonthlyInput,
  settings: PayrollSettings,
): CalculationResult {
  const totalRevenue = n(input.profileRevenue) + n(input.fashionRevenue);

  const cardExpenseTotal = (input.cardExpenses ?? [0, 0, 0]).reduce(
    (acc: number, v) => acc + n(v),
    0,
  );

  const writerCost = n(input.writerCost);
  const mainRetoucherCost =
    n(input.mainRetoucherJobCount) * n(settings.mainRetoucherRatePerJob);
  const subRetoucherCost =
    n(input.subRetoucherJobCount) * n(settings.subRetoucherRatePerJob);
  const retoucherTotalCost = mainRetoucherCost + subRetoucherCost;
  const csCost = n(settings.csMonthlySalary);

  const freelancerTotalCost = writerCost + retoucherTotalCost + csCost;
  const operatingProfit = totalRevenue - cardExpenseTotal - freelancerTotalCost;

  // Defensive clamp on the share rate.
  const rate = Math.max(0, Math.min(1, n(settings.employeeProfitShareRate)));
  // Don't bill employees when profit is negative.
  const shareBase = Math.max(0, operatingProfit);
  const employeeShare = r(shareBase * rate);
  const ownerNetProfit = operatingProfit - employeeShare;

  return {
    totalRevenue: r(totalRevenue),
    cardExpenseTotal: r(cardExpenseTotal),
    writerCost: r(writerCost),
    mainRetoucherCost: r(mainRetoucherCost),
    subRetoucherCost: r(subRetoucherCost),
    retoucherTotalCost: r(retoucherTotalCost),
    csCost: r(csCost),
    freelancerTotalCost: r(freelancerTotalCost),
    operatingProfit: r(operatingProfit),
    employeeShare,
    ownerNetProfit: r(ownerNetProfit),
  };
}
