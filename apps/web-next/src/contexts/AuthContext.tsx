'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
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

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Fallback quand le provider est absent (uniquement global-error.tsx, qui
// remplace le layout racine) : état "non authentifié" stable.
const FALLBACK_AUTH: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  refresh: async () => {},
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  // Dernier pathname pour lequel le check a abouti : tant que le pathname
  // courant n'est pas validé et qu'on n'a pas d'utilisateur, on reste en
  // "loading" (évite un redirect prématuré vers /login juste après le login).
  const [checkedPath, setCheckedPath] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const locale = useMemo(() => pathname.split('/')[1] || 'en', [pathname]);
  const didRedirectRef = useRef(false);
  // Ignore les réponses obsolètes si plusieurs checks se chevauchent
  // (navigations rapides).
  const requestSeqRef = useRef(0);

  const setBannedCookie = (value: '1' | '0') => {
    // cookie lisible côté middleware (pas httpOnly)
    document.cookie = `is_banned=${value}; path=/; max-age=${value === '1' ? 86400 : 0}`;
  };

  const isPublicAllowedWhenBanned = useMemo(() => {
    // Mode strict: seule la landing + la page /banned restent accessibles.
    const p = pathname || '';
    return p === `/${locale}` || p === `/${locale}/` || p.startsWith(`/${locale}/banned`);
  }, [pathname, locale]);

  const checkAuth = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    setIsFetching(true);
    try {
      const data = await apiFetch<{ success: boolean; user: User }>(`/auth/me`, {
        method: 'GET',
      });
      if (seq !== requestSeqRef.current) return;
      setUser(data.user || null);
      setIsAuthenticated(true);
      setBannedCookie('0');
      didRedirectRef.current = false;
    } catch (error) {
      if (seq !== requestSeqRef.current) return;

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
      if (seq === requestSeqRef.current) setIsFetching(false);
    }
  }, [isPublicAllowedWhenBanned, locale, router]);

  // Un seul check partagé par navigation (au lieu d'un par consommateur de
  // useAuth). L'utilisateur déjà chargé reste affiché pendant la revalidation
  // (stale-while-revalidate) : pas de flash de loader à chaque navigation.
  useEffect(() => {
    let cancelled = false;
    void checkAuth().finally(() => {
      if (!cancelled) setCheckedPath(pathname);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, checkAuth]);

  const isLoading = user === null && (isFetching || checkedPath !== pathname);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated, isLoading, refresh: checkAuth }),
    [user, isAuthenticated, isLoading, checkAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext) ?? FALLBACK_AUTH;
}
