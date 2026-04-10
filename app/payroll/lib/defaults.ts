import type { PayrollSettings, PayrollStore } from './types';
import { PAYROLL_SCHEMA_VERSION } from './types';

/** Epoch so we can detect "user has never configured settings". */
export const EPOCH_ISO = new Date(0).toISOString();

export const DEFAULT_SETTINGS: PayrollSettings = {
  writerRatePerJob: 0,
  retoucherRatePerJob: 0,
  csMonthlySalary: 0,
  employeeProfitShareRate: 0.3,
  updatedAt: EPOCH_ISO,
};

export const EMPTY_STORE: PayrollStore = {
  version: PAYROLL_SCHEMA_VERSION,
  settings: DEFAULT_SETTINGS,
  records: {},
};

export function isFirstVisit(settings: PayrollSettings): boolean {
  return settings.updatedAt === EPOCH_ISO;
}
