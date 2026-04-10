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

  const writerCost = n(input.writerJobCount) * n(settings.writerRatePerJob);
  const retoucherCost =
    n(input.retoucherJobCount) * n(settings.retoucherRatePerJob);
  const csCost = n(settings.csMonthlySalary);

  const freelancerTotalCost = writerCost + retoucherCost + csCost;
  const operatingProfit =
    totalRevenue - n(input.cardExpense) - freelancerTotalCost;

  // Defensive clamp on the share rate.
  const rate = Math.max(0, Math.min(1, n(settings.employeeProfitShareRate)));
  // Don't bill employees when profit is negative.
  const shareBase = Math.max(0, operatingProfit);
  const employeeShare = r(shareBase * rate);
  const ownerNetProfit = operatingProfit - employeeShare;

  return {
    totalRevenue: r(totalRevenue),
    writerCost: r(writerCost),
    retoucherCost: r(retoucherCost),
    csCost: r(csCost),
    freelancerTotalCost: r(freelancerTotalCost),
    operatingProfit: r(operatingProfit),
    employeeShare,
    ownerNetProfit: r(ownerNetProfit),
  };
}
