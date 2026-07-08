import './globals.css';
import type { ReactNode } from 'react';
import { Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${hanken.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
