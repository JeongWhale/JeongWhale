'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { calculatePayroll } from '../lib/calculate';
import { DEFAULT_SETTINGS, isFirstVisit } from '../lib/defaults';
import { currentMonth } from '../lib/format';
import { loadRecord, loadSettings, saveRecord } from '../lib/storage';
import type { MonthlyInput, PayrollSettings } from '../lib/types';
import { CalculatorForm } from './CalculatorForm';
import { ExportButtons } from './ExportButtons';
import { ResultCard } from './ResultCard';

function emptyInput(month: string): MonthlyInput {
  return {
    month,
    profileRevenue: 0,
    fashionRevenue: 0,
    cardExpense: 0,
    writerJobCount: 0,
    retoucherJobCount: 0,
    memo: '',
  };
}

export function PayrollApp() {
  const searchParams = useSearchParams();
  const requestedMonth = searchParams?.get('month');

  const [settings, setSettings] = useState<PayrollSettings>(DEFAULT_SETTINGS);
  const [input, setInput] = useState<MonthlyInput>(() =>
    emptyInput(currentMonth()),
  );
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Hydrate from localStorage on the client only to avoid SSR mismatch.
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    const targetMonth = requestedMonth || currentMonth();
    const existing = loadRecord(targetMonth);
    if (existing) {
      setInput(existing.input);
    } else {
      setInput(emptyInput(targetMonth));
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedMonth]);

  const result = useMemo(
    () => calculatePayroll(input, settings),
    [input, settings],
  );

  const firstVisit = hydrated && isFirstVisit(settings);

  const handleSave = () => {
    const record = saveRecord(input, settings);
    setToast(`${record.month} 기록이 저장되었습니다.`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleReset = () => {
    setInput(emptyInput(input.month));
  };

  const recordForExport = {
    month: input.month,
    input,
    settingsSnapshot: settings,
    result,
    savedAt: new Date().toISOString(),
  };

  return (
    <main className="layout">
      <section className="panel panel--inputs">
        <h1>월 정산 계산기</h1>
        <p className="subtitle">
          매출과 지출, 프리랜서 작업 건수를 입력하면 영업이익과 직원별 지급액을
          자동으로 계산합니다.
        </p>

        {firstVisit ? (
          <div className="banner payroll-banner--warn">
            프리랜서 단가가 아직 설정되지 않았습니다.{' '}
            <Link href="/payroll/settings" className="payroll-link">
              설정 화면으로 이동
            </Link>
            하여 기본 단가를 먼저 저장해 주세요.
          </div>
        ) : null}

        <CalculatorForm value={input} onChange={setInput} />

        <div className="payroll-actions">
          <button
            type="button"
            className="generate-btn"
            onClick={handleSave}
            disabled={!hydrated}
          >
            이 달 저장하기
          </button>
          <button
            type="button"
            className="payroll-chip payroll-chip--lg"
            onClick={handleReset}
          >
            초기화
          </button>
        </div>

        {toast ? (
          <div className="banner payroll-banner--success">{toast}</div>
        ) : null}
      </section>

      <section className="panel payroll-panel--result">
        <ResultCard
          month={input.month}
          input={input}
          settings={settings}
          result={result}
        />

        <ExportButtons record={recordForExport} />

        {/* Hidden off-screen light-themed clone used by the PDF exporter. */}
        <div className="payroll-printable-host" aria-hidden="true">
          <ResultCard
            month={input.month}
            input={input}
            settings={settings}
            result={result}
            printMode
            printId="payroll-printable"
          />
        </div>
      </section>
    </main>
  );
}
