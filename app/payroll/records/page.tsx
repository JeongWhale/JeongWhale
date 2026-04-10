import { RecordsTable } from '../components/RecordsTable';

export default function RecordsPage() {
  return (
    <main className="payroll-page">
      <h1>월별 정산 내역</h1>
      <p className="subtitle">
        저장된 월별 기록입니다. 과거 기록은 저장 당시의 단가 설정으로 고정
        계산되어 있어 현재 설정을 바꿔도 변하지 않습니다.
      </p>
      <RecordsTable />
    </main>
  );
}
