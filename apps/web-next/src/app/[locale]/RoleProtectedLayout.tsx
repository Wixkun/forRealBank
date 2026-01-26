'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type RoleProtectedLayoutProps = {
  children: ReactNode;
  allowedRoles: string[];
};

export function RoleProtectedLayout({ children, allowedRoles }: RoleProtectedLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const locale = useMemo(() => pathname.split('/')[1] || 'en', [pathname]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/${locale}/login`);
    }
  }, [isLoading, user, router, locale]);

  const hasRole = useMemo(() => {
    if (!user?.roles || !Array.isArray(user.roles)) return false;
    return allowedRoles.some((r) => user.roles.includes(r));
  }, [user, allowedRoles]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-950 via-teal-900 to-cyan-800">
        <div className="text-white text-lg">Vérification d&apos;authentification...</div>
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Accès refusé.</div>
      </div>
    );
  }

  return <>{children}</>;
}
