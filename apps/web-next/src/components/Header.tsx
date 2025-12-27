'use client';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LanguageSwitcher } from '@/components/organisms/LanguageSwitcher';
import { useTranslations } from 'next-intl';

export default function Header() {
    const t = useTranslations('common');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = `/${locale}/login`;
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-end">
        <div className="flex items-center gap-3">
          <LanguageSwitcher theme="dark" />
          
          {isAuthenticated === null ? (
            <div className="w-24 h-10 bg-gray-700/30 rounded-md animate-pulse" />
          ) : isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md border border-red-400 text-red-300 hover:bg-red-400/10 transition font-medium"
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
                className="px-4 py-2 rounded-md bg-gradient-to-r from-teal-400 to-cyan-500 text-gray-900 font-semibold hover:from-teal-300 hover:to-cyan-400 transition"
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
