'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { extractLocaleFromPathname, performAuthCheck } from '@/lib/auth-utils';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

        try {
          const isAuthorized = await performAuthCheck(apiUrl);

          if (isAuthorized) {
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }

          const locale = extractLocaleFromPathname(pathname);
          router.push(`/${locale}/login`);
        } catch (error) {
          console.error('[ProtectedLayout] Auth check failed:', error);
          const locale = extractLocaleFromPathname(pathname);
          router.push(`/${locale}/login`);
        }
      } catch (error) {
        console.error('[ProtectedLayout] Unexpected error:', error);
        const locale = extractLocaleFromPathname(pathname);
        router.push(`/${locale}/login`);
      }
    };

    initializeAuth();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-800">
        <div className="text-white text-lg">Vérification d&apos;authentification...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
