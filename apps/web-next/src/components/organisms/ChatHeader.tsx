'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { usePathname, useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/components/organisms/LanguageSwitcher';
import { useTranslations } from 'next-intl';

export function ChatHeader() {
  const t = useTranslations('common');
  const { theme, toggleTheme, mounted } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split('/')[1] || 'en';

  const handleLogout = async () => {
    try {
      await fetch(`/api/proxy/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      // Couper les sockets côté client (sinon socket.io va tenter de se reconnecter)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        document.cookie = 'is_banned=0; path=/; max-age=0';

        // Déconnecte toutes les sockets éventuellement actives
        try {
          const sockets = (window as Window & {
            __forreal_sockets__?: Array<{ disconnect?: () => void }>;
          }).__forreal_sockets__;
          sockets?.forEach((s) => s?.disconnect?.());
        } catch {
          // ignore
        }
      }

      router.push(`/${locale}/login`);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleDashboard = () => {
    router.push(`/${locale}/dashboard`);
  };

  if (!mounted) {
    return (
      <header className="border-b border-gray-700/50 bg-black/40 backdrop-blur-lg sticky top-0 z-50 shadow-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleDashboard}
              className="text-2xl font-semibold bg-linear-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer"
            >
              Avenir
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`border-b sticky top-0 z-50 shadow-xl backdrop-blur-lg ${
        theme === 'dark' ? 'border-gray-700/50 bg-black/40' : 'border-gray-200 bg-white/80'
      }`}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleDashboard}
            className={`text-2xl font-semibold bg-linear-to-r ${
              theme === 'dark' ? 'from-teal-400 to-cyan-300' : 'from-teal-600 to-cyan-600'
            } bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer`}
          >
            Avenir
          </button>
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </div>
    </header>
  );
}
