'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  // État d'auth partagé via AuthProvider : pas de fetch /auth/me dupliqué ici.
  const { isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch(`/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (typeof window !== 'undefined') {
        window.location.href = `/${locale}/login`;
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 force-dark bg-linear-to-br from-teal-950/90 via-teal-900/75 to-teal-800/75 backdrop-blur border-b border-edge-strong">
      <div className="px-6 py-4 flex items-center justify-end">
        <div className="flex items-center gap-3">
          <LanguageSwitcher theme="dark" />

          {isAuthenticated === null ? (
            <div className="w-24 h-10 bg-gray-700/30 rounded-md animate-pulse" />
          ) : isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md border border-red-400 text-danger hover:bg-red-400/10 transition font-medium"
            >
              {t('logout')}
            </button>
          ) : (
            <>
              <Link
                href={`/${locale}/login`}
                className="px-4 py-2 rounded-md border border-teal-400 text-teal-300 hover:bg-teal-400/10 transition font-medium"
              >
                {t('login')}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-hover transition"
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
