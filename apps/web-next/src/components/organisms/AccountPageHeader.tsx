'use client';

import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';

type AccountPageHeaderProps = {
  accountName: string;
  accountType: string;
  balance: string;
  locale: string;
  labels: {
    balance: string;
  };
};

export function AccountPageHeader({
  accountName,
  accountType,
  balance,
  locale,
  labels,
}: AccountPageHeaderProps) {
  const { theme, mounted, toggleTheme } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  return (
    <header
      className={`border-b transition-colors ${
        currentTheme === 'dark'
          ? 'bg-gray-900/80 border-gray-800'
          : 'bg-white border-gray-200'
      } backdrop-blur-sm sticky top-0 z-50`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href={`/${locale}/dashboard`}
              className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent hover:from-teal-300 hover:to-cyan-400 transition-all"
            >
              Avenir
            </Link>

            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-px ${
                  currentTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                }`}
              />
              <div>
                <h1
                  className={`text-xl font-semibold ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {accountName}
                </h1>
                <p
                  className={`text-sm ${
                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {accountType}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p
                className={`text-sm ${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {labels.balance}
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">
                {balance}
              </p>
            </div>

            <button
              onClick={toggleTheme}
              className={`p-3 rounded-xl transition-all hover:scale-110 ${
                currentTheme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              aria-label="Toggle theme"
            >
              <span className="text-xl">{currentTheme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
