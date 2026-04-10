'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { formatKRW, formatMonth } from '../lib/format';
import { deleteRecord, listRecords } from '../lib/storage';
import type { MonthlyRecord } from '../lib/types';
import { ExportButtons } from './ExportButtons';

export function RecordsTable() {
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setRecords(listRecords());
  }, []);

  useEffect(() => {
    setMounted(true);
    refresh();
  }, [refresh]);

  const handleDelete = (month: string) => {
    if (!confirm(`${formatMonth(month)} 기록을 삭제할까요?`)) return;
    deleteRecord(month);
    refresh();
  };

  if (!mounted) {
    return <p className="payroll-empty">불러오는 중…</p>;
  }

  if (records.length === 0) {
    return (
      <div className="payroll-empty">
        <p>아직 저장된 월이 없습니다.</p>
        <Link href="/payroll" className="payroll-link">
          계산기로 이동 →
        </Link>
      </div>
    );
  }

  return (
    <div className="payroll-records">
      <table>
        <thead>
          <tr>
            <th>월</th>
            <th className="payroll-money">총 매출</th>
            <th className="payroll-money">영업이익</th>
            <th className="payroll-money">사업주 순이익</th>
            <th className="payroll-money">직원 분배</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.month}>
              <td>{formatMonth(r.month)}</td>
              <td className="payroll-money">
                {formatKRW(r.result.totalRevenue)}
              </td>
              <td
                className={
                  'payroll-money' +
                  (r.result.operatingProfit < 0
                    ? ' payroll-money--negative'
                    : '')
                }
              >
                {formatKRW(r.result.operatingProfit)}
              </td>
              <td className="payroll-money payroll-money--accent">
                {formatKRW(r.result.ownerNetProfit)}
              </td>
              <td className="payroll-money">
                {formatKRW(r.result.employeeShare)}
              </td>
              <td>
                <div className="payroll-records__actions">
                  <Link
                    href={`/payroll?month=${r.month}`}
                    className="payroll-chip"
                  >
                    보기
                  </Link>
                  <ExportButtons record={r} compact />
                  <button
                    type="button"
                    className="payroll-chip payroll-chip--danger"
                    onClick={() => handleDelete(r.month)}
                  >
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
