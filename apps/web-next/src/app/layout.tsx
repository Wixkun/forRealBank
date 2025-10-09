'use client';
import './globals.css';
import type { ReactNode } from 'react';
import Footer from '@/shared/Footer';
import Header from '@/shared/Header';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideLayout = pathname === '/login' || pathname === '/register';

  return (
    <html lang="fr">
      <body>
        {!hideLayout && <Header />}

        <main>{children}</main>

        {<Footer />}
      </body>
    </html>
  );
}
