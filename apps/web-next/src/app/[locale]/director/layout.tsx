'use client';

import type { ReactNode } from 'react';
import { RoleProtectedLayout } from '../RoleProtectedLayout';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function DirectorLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <RoleProtectedLayout allowedRoles={['DIRECTOR']}>{children}</RoleProtectedLayout>
    </ThemeProvider>
  );
}
