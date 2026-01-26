'use client';

import type { ReactNode } from 'react';
import { RoleProtectedLayout } from '../RoleProtectedLayout';

export default function NotificationsLayout({ children }: { children: ReactNode }) {
  return <RoleProtectedLayout allowedRoles={['ADVISOR', 'DIRECTOR']}>{children}</RoleProtectedLayout>;
}
