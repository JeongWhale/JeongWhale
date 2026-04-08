import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '카드뉴스 생성기 · Nano Banana Pro',
  description:
    '템플릿과 기획안을 입력하면 Gemini Nano Banana Pro로 인스타그램 카드뉴스를 생성합니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
