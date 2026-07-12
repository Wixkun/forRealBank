import type { ReactNode } from 'react';
import { ProtectedLayout } from '../ProtectedLayout';
import { DashboardShell } from '@/features/dashboard/components/DashboardShell';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StatementProvider } from '@/features/statements/StatementContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedLayout>
      {/* Plus de forcedTheme : la page Paramètres expose désormais le choix
          sombre / clair (persisté en localStorage par le ThemeContext). */}
      <ThemeProvider>
        <StatementProvider>
          <DashboardShell>{children}</DashboardShell>
        </StatementProvider>
      </ThemeProvider>
    </ProtectedLayout>
  );
}
