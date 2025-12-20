'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';

  const hideLayout =
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/forgot-password') ||
    pathname === '/' ||
    pathname.endsWith('/fr') ||
    pathname.endsWith('/en');

  return (
    <>
      {!hideLayout && <Header />}
      <main>{children}</main>
      {!hideLayout && <Footer />}
    </>
  );
}
