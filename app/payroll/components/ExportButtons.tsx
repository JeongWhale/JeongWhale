'use client';

import { useState } from 'react';
import type { MonthlyRecord } from '../lib/types';

interface Props {
  record: MonthlyRecord;
  compact?: boolean;
  /** DOM id of a printable node for PDF export; defaults to 'payroll-printable'. */
  printableId?: string;
}

export function ExportButtons({
  record,
  compact,
  printableId = 'payroll-printable',
}: Props) {
  const [busy, setBusy] = useState<'xlsx' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExcel = async () => {
    setBusy('xlsx');
    setError(null);
    try {
      const mod = await import('../lib/exportExcel');
      mod.exportMonthToXlsx(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    setBusy('pdf');
    setError(null);
    try {
      const mod = await import('../lib/exportPdf');
      await mod.exportMonthToPdf(record, printableId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const cls = compact ? 'payroll-chip' : 'payroll-chip payroll-chip--lg';

  return (
    <div className="payroll-export">
      <button
        type="button"
        className={cls}
        onClick={handleExcel}
        disabled={busy !== null}
      >
        {busy === 'xlsx' ? 'Excel…' : 'Excel'}
      </button>
      <button
        type="button"
        className={cls}
        onClick={handlePdf}
        disabled={busy !== null}
      >
        {busy === 'pdf' ? 'PDF…' : 'PDF'}
      </button>
      {error ? (
        <div className="banner banner--error payroll-export__error">
          {error}
        </div>
      ) : null}
    </div>
  );
}
