import type { PayrollSettings, PayrollStore } from './types';
import { PAYROLL_SCHEMA_VERSION } from './types';

/** Epoch so we can detect "user has never configured settings". */
export const EPOCH_ISO = new Date(0).toISOString();

export const DEFAULT_CARD_LABELS: [string, string, string] = [
  '카드 1',
  '카드 2',
  '카드 3',
];

export const DEFAULT_SETTINGS: PayrollSettings = {
  cardLabels: [...DEFAULT_CARD_LABELS] as [string, string, string],
  mainRetoucherRatePerJob: 0,
  subRetoucherRatePerJob: 0,
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
