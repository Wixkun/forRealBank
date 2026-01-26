'use client';

import type { ReactNode } from 'react';
import { RoleProtectedLayout } from '../../RoleProtectedLayout';

export default function ChatManageLayout({ children }: { children: ReactNode }) {
  return <RoleProtectedLayout allowedRoles={['ADVISOR', 'DIRECTOR']}>{children}</RoleProtectedLayout>;
}
