'use client';

import { useEffect, useState } from 'react';
import { SettingsForm } from '../components/SettingsForm';
import { DEFAULT_SETTINGS } from '../lib/defaults';
import { loadSettings } from '../lib/storage';
import type { PayrollSettings } from '../lib/types';

export default function SettingsPage() {
  const [initial, setInitial] = useState<PayrollSettings | null>(null);

  useEffect(() => {
    setInitial(loadSettings() ?? DEFAULT_SETTINGS);
  }, []);

  if (!initial) {
    return <div className="payroll-empty">불러오는 중…</div>;
  }

  return (
    <main className="payroll-page">
      <h1>설정</h1>
      <p className="subtitle">
        작가 · 보정관 · CS 단가와 직원 분배 비율을 저장합니다. 저장 이후
        계산기는 자동으로 이 값을 사용합니다.
      </p>
      <div className="payroll-settings-wrap">
        <SettingsForm initial={initial} />
      </div>
    </main>
  );
}
