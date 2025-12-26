import type { ReactNode } from 'react';
import { ProtectedLayout } from '../ProtectedLayout';

export default function MarketLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedLayout>
      {children}
    </ProtectedLayout>
  );
}
