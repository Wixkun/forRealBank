import type { ReactNode } from 'react';
import { ProtectedLayout } from '../ProtectedLayout';

export default function ChatLayout({
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
