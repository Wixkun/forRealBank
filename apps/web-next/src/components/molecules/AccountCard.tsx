'use client';

import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';

type AccountCardProps = {
  id: string;
  name: string;
  balance: number;
  iban: string;
  type: 'checking' | 'savings';
  accountType?: 'banking' | 'brokerage';
  locale: string;
};

export function AccountCard({ id, name, balance, iban, type, accountType = 'banking', locale }: AccountCardProps) {
  const { theme, mounted } = useTheme();

  const currentTheme = mounted ? theme : 'dark';

  const href = accountType === 'brokerage' 
    ? `/${locale}/brokerage/${id}` 
    : `/${locale}/account/${type}`;

  return (
    <Link href={href} className={`block backdrop-blur-sm hover:shadow-xl rounded-2xl p-5 transition cursor-pointer group border ${
      currentTheme === 'dark'
        ? 'bg-gradient-to-r from-gray-800/90 to-gray-900/90 hover:from-gray-800 hover:to-gray-900 border-gray-700/50 hover:border-teal-500/50'
        : 'bg-white border-gray-200 hover:border-teal-500'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full shadow-lg ${type === 'checking' ? 'bg-gradient-to-r from-teal-400 to-cyan-400' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}></div>
            <h4 className={`font-medium text-base ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{name}</h4>
          </div>
          <p className={`text-sm font-mono ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{iban}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-semibold ${currentTheme === 'dark' ? 'bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent' : 'text-teal-600'}`}>
            {balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </p>
        </div>
      </div>
    </Link>
  );
}
