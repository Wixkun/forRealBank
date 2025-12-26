import type { ReactNode } from 'react';
import { ProtectedLayout } from '../ProtectedLayout';

export default function AccountLayout({
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
