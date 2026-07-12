'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { extractLocaleFromPathname } from '@/lib/auth-utils';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

// S'appuie sur l'état d'auth partagé (AuthProvider) : pas d'appel /auth/me
// supplémentaire ici, on ne fait que réagir au résultat du check global.
export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const t = useTranslations('common');

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const didRedirectRef = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated !== false) return;
    if (didRedirectRef.current) return;
    didRedirectRef.current = true;
    const locale = extractLocaleFromPathname(pathname);
    router.push(`/${locale}/login`);
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-950 via-teal-900 to-teal-800">
        <div className="text-white text-lg">{t('authChecking')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
