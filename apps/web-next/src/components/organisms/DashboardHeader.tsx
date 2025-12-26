'use client';

import { useTheme } from '@/contexts/ThemeContext';

type DashboardHeaderProps = {
  userName: string;
};

export function DashboardHeader({ }: DashboardHeaderProps) {
  const { theme, toggleTheme, mounted } = useTheme();

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
            <button className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-lg ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300'
                : 'bg-gradient-to-br from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500'
            }`}>
              <span className="text-base">👤</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
