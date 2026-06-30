import type { ReactNode } from 'react';
import { ProtectedLayout } from '../ProtectedLayout';
import { DashboardShell } from '@/features/dashboard/components/DashboardShell';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedLayout>
      <ThemeProvider>
        <DashboardShell>{children}</DashboardShell>
      </ThemeProvider>
    </ProtectedLayout>
  );
}
