'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { usePathname, useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/components/organisms/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

type DashboardHeaderProps = {
  userName?: string;
  userId?: string;
};

export function DashboardHeader({ userName, userId }: DashboardHeaderProps) {
  const t = useTranslations('common');
  const { theme, toggleTheme, mounted } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split('/')[1] || 'en';

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!mounted) {
    return (
      <header className="border-b border-gray-700/50 bg-black/40 backdrop-blur-lg sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">Avenir</h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`border-b sticky top-0 z-50 shadow-xl backdrop-blur-lg ${
      theme === 'dark' 
        ? 'border-gray-700/50 bg-black/40' 
        : 'border-gray-200 bg-white/80'
    }`}>
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-semibold bg-gradient-to-r ${
            theme === 'dark'
              ? 'from-teal-400 to-cyan-300'
              : 'from-teal-600 to-cyan-600'
          } bg-clip-text text-transparent`}>
            Avenir
          </h1>
          <div className="flex items-center gap-4">
            {userId && <NotificationCenter userId={userId} />}

            <LanguageSwitcher theme={theme} />
            
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-lg ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              aria-label="Toggle theme"
            >
              <span className="text-xl">{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
            
            <button
              onClick={handleLogout}
              className={`px-4 py-2 rounded-lg font-medium transition shadow-lg ${
                theme === 'dark'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
              aria-label="Logout"
            >
              {t('logout')}
            </button>
            
            <button className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-lg ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300'
                : 'bg-gradient-to-br from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500'
            }`}>
              <span className="text-base" title={userName || 'Profile'}>👤</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
