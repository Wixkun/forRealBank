'use client';

import { useTheme } from '@/contexts/ThemeContext';

type BalanceCardProps = {
  label: string;
  amount: number;
  growthText: string;
};

export function BalanceCard({ label, amount, growthText }: BalanceCardProps) {
  const { theme, mounted } = useTheme();

  const currentTheme = mounted ? theme : 'dark';

  return (
    <div className={`rounded-3xl p-8 mb-6 relative overflow-hidden shadow-2xl border ${
      currentTheme === 'dark'
        ? 'bg-gradient-to-br from-black via-gray-900 to-black border-gray-800'
        : 'bg-gradient-to-br from-teal-500 via-cyan-600 to-teal-600 border-teal-400'
    }`}>
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl ${
        currentTheme === 'dark' ? 'bg-teal-500/20' : 'bg-white/20'
      }`}></div>
      <div className={`absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl ${
        currentTheme === 'dark' ? 'bg-cyan-400/10' : 'bg-yellow-200/30'
      }`}></div>
      <div className="relative">
        <p className={`text-base mb-2 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-white/90'}`}>{label}</p>
        <p className={`text-6xl font-bold mb-4 drop-shadow-lg ${
          currentTheme === 'dark'
            ? 'bg-gradient-to-r from-teal-300 via-cyan-200 to-teal-400 bg-clip-text text-transparent'
            : 'text-white'
        }`}>
          {amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
        </p>
        <div className={`flex items-center gap-2 text-base backdrop-blur-sm rounded-full px-3 py-1 w-fit border ${
          currentTheme === 'dark'
            ? 'text-teal-300 bg-teal-500/10 border-teal-500/20'
            : 'text-white bg-white/20 border-white/30'
        }`}>
          <span>↗</span>
          <span>{growthText}</span>
        </div>
      </div>
    </div>
  );
}
