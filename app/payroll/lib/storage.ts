import { calculatePayroll } from './calculate';
import { DEFAULT_SETTINGS, EMPTY_STORE } from './defaults';
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

function migrate(raw: unknown): PayrollStore {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_STORE };
  const obj = raw as Partial<PayrollStore>;

  const settings: PayrollSettings = {
    ...DEFAULT_SETTINGS,
    ...(obj.settings ?? {}),
  };

  const records: Record<string, MonthlyRecord> = {};
  if (obj.records && typeof obj.records === 'object') {
    for (const [k, v] of Object.entries(obj.records)) {
      if (v && typeof v === 'object' && 'input' in v && 'result' in v) {
        records[k] = v as MonthlyRecord;
      }
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
