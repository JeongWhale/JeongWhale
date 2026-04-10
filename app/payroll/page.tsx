import { Suspense } from 'react';
import { PayrollApp } from './components/PayrollApp';

export default function PayrollPage() {
  return (
    <Suspense
      fallback={<div className="payroll-empty">불러오는 중…</div>}
    >
      <PayrollApp />
    </Suspense>
  );
}
