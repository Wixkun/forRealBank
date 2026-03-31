'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  lastLoginAt?: string;
  createdAt?: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const locale = useMemo(() => pathname.split('/')[1] || 'en', [pathname]);
  const didRedirectRef = useRef(false);

  const setBannedCookie = (value: '1' | '0') => {
    // cookie lisible côté middleware (pas httpOnly)
    document.cookie = `is_banned=${value}; path=/; max-age=${value === '1' ? 86400 : 0}`;
  };

  const isPublicAllowedWhenBanned = useMemo(() => {
    // Mode strict: seule la landing + la page /banned restent accessibles.
    const p = pathname || '';
    return (
      p === `/${locale}` ||
      p === `/${locale}/` ||
      p.startsWith(`/${locale}/banned`)
    );
  }, [pathname, locale]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const data = await apiFetch<{ success: boolean; user: User }>(`/auth/me`, { method: 'GET' });
        setUser(data.user || null);
        setIsAuthenticated(true);
        setBannedCookie('0');
      } catch (error) {
        // Cas spécial: banni -> redirection globale
        if (error instanceof ApiError && error.kind === 'BANNED') {
          setUser(null);
          setIsAuthenticated(false);
          setBannedCookie('1');
          if (!isPublicAllowedWhenBanned && !didRedirectRef.current) {
            didRedirectRef.current = true;
            router.replace(`/${locale}/banned`);
          }
          return;
        }

        // Non authentifié
        setUser(null);
        setIsAuthenticated(false);
        setBannedCookie('0');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router, locale, isPublicAllowedWhenBanned]);

  return { isAuthenticated, isLoading, user };
}
