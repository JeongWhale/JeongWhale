import type { Metadata } from 'next';
import { NavBar } from './components/NavBar';

export const metadata: Metadata = {
  title: '정산 계산기 · JeongWhale',
  description:
    '프로필 사진 / 패션 컨설팅 사업의 매출·지출·프리랜서 비용을 입력하면 영업이익과 직원 분배를 자동 계산합니다.',
};

export default function PayrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
