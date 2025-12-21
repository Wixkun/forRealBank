'use client';

import { useTheme } from '@/contexts/ThemeContext';

type TransactionItemProps = {
  description: string;
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  isLast?: boolean;
};

export function TransactionItem({ description, date, amount, type, isLast = false }: TransactionItemProps) {
  const { theme, mounted } = useTheme();

  const currentTheme = mounted ? theme : 'dark';

  return (
    <div className={`flex items-center justify-between p-4 transition cursor-pointer ${
      currentTheme === 'dark' ? 'hover:bg-gray-900/50' : 'hover:bg-gray-50'
    } ${!isLast ? (currentTheme === 'dark' ? 'border-b border-gray-700/50' : 'border-b border-gray-200') : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
          type === 'credit' ? 'bg-gradient-to-br from-teal-500 to-cyan-500' : (currentTheme === 'dark' ? 'bg-gradient-to-br from-gray-600 to-gray-700' : 'bg-gradient-to-br from-gray-300 to-gray-400')
        }`}>
          <span className="text-base text-white">{type === 'credit' ? '↓' : '↑'}</span>
        </div>
        <div>
          <p className={`font-medium text-base ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{description}</p>
          <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{date}</p>
        </div>
      </div>
      <p className={`font-semibold text-base ${
        type === 'credit' ? (currentTheme === 'dark' ? 'text-teal-400' : 'text-teal-600') : (currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700')
      }`}>
        {amount > 0 ? '+' : ''}
        {amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
      </p>
    </div>
  );
}
