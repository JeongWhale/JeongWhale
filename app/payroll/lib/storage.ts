import { calculatePayroll } from './calculate';
import { DEFAULT_CARD_LABELS, DEFAULT_SETTINGS, EMPTY_STORE } from './defaults';
import type {
  MonthlyInput,
  MonthlyRecord,
  PayrollSettings,
  PayrollStore,
} from './types';
import { PAYROLL_SCHEMA_VERSION } from './types';

const STORAGE_KEY = 'jeongwhale.payroll.v1';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function toCardExpenses(
  legacy: unknown,
  arr: unknown,
): [number, number, number] {
  // New shape: array of up to 3 numbers.
  if (Array.isArray(arr)) {
    const out: [number, number, number] = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      const v = arr[i];
      out[i] = typeof v === 'number' && Number.isFinite(v) ? v : 0;
    }
    return out;
  }
  // Legacy shape: single `cardExpense` number → put in the first slot.
  if (typeof legacy === 'number' && Number.isFinite(legacy)) {
    return [legacy, 0, 0];
  }
  return [0, 0, 0];
}

function toCardLabels(raw: unknown): [string, string, string] {
  if (Array.isArray(raw)) {
    return [
      typeof raw[0] === 'string' && raw[0] ? raw[0] : DEFAULT_CARD_LABELS[0],
      typeof raw[1] === 'string' && raw[1] ? raw[1] : DEFAULT_CARD_LABELS[1],
      typeof raw[2] === 'string' && raw[2] ? raw[2] : DEFAULT_CARD_LABELS[2],
    ];
  }
  return [...DEFAULT_CARD_LABELS] as [string, string, string];
}

function migrate(raw: unknown): PayrollStore {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_STORE };
  const obj = raw as Partial<PayrollStore> & Record<string, unknown>;

  // Migrate settings. Legacy fields to strip: writerRatePerJob, retoucherRatePerJob.
  const rawSettings = (obj.settings ?? {}) as Record<string, unknown>;
  const legacyRetoucherRate =
    typeof rawSettings.retoucherRatePerJob === 'number'
      ? (rawSettings.retoucherRatePerJob as number)
      : undefined;
  const {
    writerRatePerJob: _legacyWriterRate,
    retoucherRatePerJob: _legacyRetoucherRate,
    cardLabels: rawCardLabels,
    mainRetoucherRatePerJob: rawMainRate,
    subRetoucherRatePerJob: rawSubRate,
    ...rest
  } = rawSettings;
  void _legacyWriterRate;
  void _legacyRetoucherRate;

  const settings: PayrollSettings = {
    ...DEFAULT_SETTINGS,
    ...(rest as Partial<PayrollSettings>),
    cardLabels: toCardLabels(rawCardLabels),
    mainRetoucherRatePerJob:
      typeof rawMainRate === 'number'
        ? rawMainRate
        : (legacyRetoucherRate ?? 0),
    subRetoucherRatePerJob:
      typeof rawSubRate === 'number' ? rawSubRate : 0,
  };

  // Migrate records. Legacy input fields to handle:
  //   cardExpense → cardExpenses[0]
  //   writerJobCount → writerCost via legacy rate
  //   retoucherJobCount → mainRetoucherJobCount (sub defaults to 0)
  const records: Record<string, MonthlyRecord> = {};
  if (obj.records && typeof obj.records === 'object') {
    for (const [k, v] of Object.entries(
      obj.records as Record<string, unknown>,
    )) {
      if (!v || typeof v !== 'object') continue;
      const rec = v as MonthlyRecord & {
        input: MonthlyRecord['input'] & {
          cardExpense?: number;
          writerJobCount?: number;
          retoucherJobCount?: number;
        };
        settingsSnapshot: MonthlyRecord['settingsSnapshot'] & {
          writerRatePerJob?: number;
          retoucherRatePerJob?: number;
        };
      };
      if (!('input' in rec) || !('result' in rec)) continue;

      const legacyWriterCount = rec.input.writerJobCount ?? 0;
      const legacyWriterRate = rec.settingsSnapshot.writerRatePerJob ?? 0;
      const writerCost =
        typeof rec.input.writerCost === 'number'
          ? rec.input.writerCost
          : legacyWriterCount * legacyWriterRate;

      const legacyRetoucherCount = rec.input.retoucherJobCount ?? 0;

      const snapshotLegacyRetoucherRate =
        rec.settingsSnapshot.retoucherRatePerJob ?? 0;

      records[k] = {
        ...rec,
        input: {
          ...rec.input,
          cardExpenses: toCardExpenses(
            rec.input.cardExpense,
            (rec.input as unknown as { cardExpenses?: unknown }).cardExpenses,
          ),
          writerCost,
          mainRetoucherJobCount:
            rec.input.mainRetoucherJobCount ?? legacyRetoucherCount,
          subRetoucherJobCount: rec.input.subRetoucherJobCount ?? 0,
        },
        settingsSnapshot: {
          ...rec.settingsSnapshot,
          cardLabels: toCardLabels(
            (rec.settingsSnapshot as unknown as { cardLabels?: unknown })
              .cardLabels,
          ),
          mainRetoucherRatePerJob:
            rec.settingsSnapshot.mainRetoucherRatePerJob ??
            snapshotLegacyRetoucherRate,
          subRetoucherRatePerJob:
            rec.settingsSnapshot.subRetoucherRatePerJob ?? 0,
          csMonthlySalary: rec.settingsSnapshot.csMonthlySalary ?? 0,
          employeeProfitShareRate:
            rec.settingsSnapshot.employeeProfitShareRate ?? 0.3,
          updatedAt:
            rec.settingsSnapshot.updatedAt ?? new Date().toISOString(),
        },
      };
    }
  }

  return {
    version: PAYROLL_SCHEMA_VERSION,
    settings,
    records,
  };
}

export function loadStore(): PayrollStore {
  if (!isBrowser()) return { ...EMPTY_STORE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STORE };
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (err) {
    // Preserve the corrupt blob under a timestamped key so the user can recover.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        localStorage.setItem(
          `${STORAGE_KEY}.corrupt.${Date.now()}`,
          raw,
        );
      }
    } catch {
      /* ignore */
    }
    console.error('[payroll] failed to load store, resetting', err);
    return { ...EMPTY_STORE };
  }
}

export function saveStore(store: PayrollStore): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('[payroll] failed to save store', err);
  }
}

export function loadSettings(): PayrollSettings {
  return loadStore().settings;
}

export function saveSettings(next: PayrollSettings): PayrollSettings {
  const store = loadStore();
  const updated: PayrollSettings = {
    ...next,
    updatedAt: new Date().toISOString(),
  };
  saveStore({ ...store, settings: updated });
  return updated;
}

export function loadRecord(month: string): MonthlyRecord | null {
  const store = loadStore();
  return store.records[month] ?? null;
}

export function listRecords(): MonthlyRecord[] {
  const store = loadStore();
  return Object.values(store.records).sort((a, b) =>
    a.month < b.month ? 1 : a.month > b.month ? -1 : 0,
  );
}

/**
 * Upsert a record for the given month, recomputing the result and taking
 * a snapshot of current settings.
 */
export function saveRecord(
  input: MonthlyInput,
  settings: PayrollSettings,
): MonthlyRecord {
  const store = loadStore();
  const record: MonthlyRecord = {
    month: input.month,
    input,
    settingsSnapshot: settings,
    result: calculatePayroll(input, settings),
    savedAt: new Date().toISOString(),
  };
  saveStore({
    ...store,
    records: { ...store.records, [input.month]: record },
  });
  return record;
}

export function deleteRecord(month: string): void {
  const store = loadStore();
  if (!(month in store.records)) return;
  const { [month]: _removed, ...rest } = store.records;
  void _removed;
  saveStore({ ...store, records: rest });
}
