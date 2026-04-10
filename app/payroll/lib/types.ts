// Schema version for localStorage; bump when shape changes.
export const PAYROLL_SCHEMA_VERSION = 1 as const;

/** User-editable freelancer rates, card labels, & profit split. */
export interface PayrollSettings {
  /** Editable labels for the 3 expense cards (e.g. "사업자 카드", "개인 카드"). */
  cardLabels: [string, string, string];
  mainRetoucherRatePerJob: number; // 메인 보정가 건당 단가 (KRW)
  subRetoucherRatePerJob: number; // 보조 보정가 건당 단가 (KRW)
  csMonthlySalary: number; // CS 프리랜서 월 고정 급여 (KRW)
  employeeProfitShareRate: number; // 0..1 (기본 0.30)
  updatedAt: string; // ISO
}

/** Raw monthly inputs the user enters. */
export interface MonthlyInput {
  month: string; // 'YYYY-MM'
  profileRevenue: number; // 프로필 사진 매출
  fashionRevenue: number; // 패션 컨설팅 매출
  /** Per-card expense totals (always length 3). */
  cardExpenses: [number, number, number];
  writerCost: number; // 작가 프리랜서 월 총 비용 (서비스별 단가가 달라 총액으로 입력)
  mainRetoucherJobCount: number; // 메인 보정가 건수
  subRetoucherJobCount: number; // 보조 보정가 건수
  memo?: string;
}

/** Computed breakdown — pure function of (input, settings). */
export interface CalculationResult {
  totalRevenue: number; // 총 매출
  cardExpenseTotal: number; // 카드 지출 합계
  writerCost: number; // 작가 비용
  mainRetoucherCost: number; // 메인 보정가 비용
  subRetoucherCost: number; // 보조 보정가 비용
  retoucherTotalCost: number; // 보정가 총비용
  csCost: number; // CS 비용
  freelancerTotalCost: number; // 프리랜서 총비용
  operatingProfit: number; // 영업이익
  employeeShare: number; // 30% 직원 급여
  ownerNetProfit: number; // 사업주 순이익
}

/** Persisted per-month snapshot. */
export interface MonthlyRecord {
  month: string; // 'YYYY-MM' (primary key)
  input: MonthlyInput;
  /** Snapshot of settings at save-time so past months stay stable. */
  settingsSnapshot: PayrollSettings;
  result: CalculationResult;
  savedAt: string; // ISO
}

/** Root document stored in localStorage. */
export interface PayrollStore {
  version: typeof PAYROLL_SCHEMA_VERSION;
  settings: PayrollSettings;
  records: Record<string, MonthlyRecord>; // keyed by month 'YYYY-MM'
}
