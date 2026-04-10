'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/payroll', label: '계산기' },
  { href: '/payroll/records', label: '월별 내역' },
  { href: '/payroll/settings', label: '설정' },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="payroll-nav">
      <div className="payroll-nav__brand">정산 계산기</div>
      <div className="payroll-nav__links">
        {links.map((l) => {
          const active =
            l.href === '/payroll'
              ? pathname === '/payroll'
              : pathname?.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={
                active
                  ? 'payroll-nav__link payroll-nav__link--active'
                  : 'payroll-nav__link'
              }
            >
              {l.label}
            </Link>
          );
        })}
        <Link href="/" className="payroll-nav__link payroll-nav__link--ghost">
          ← 카드뉴스
        </Link>
      </div>
    </nav>
  );
}
