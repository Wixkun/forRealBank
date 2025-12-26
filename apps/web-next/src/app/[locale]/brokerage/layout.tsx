import type { ReactNode } from 'react';
import { ProtectedLayout } from '../ProtectedLayout';

export default function BrokerageLayout({
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
