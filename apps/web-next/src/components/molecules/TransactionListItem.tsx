'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Icon } from '@/components/ui/Icon';

type TransactionListItemProps = {
  type: 'credit' | 'debit' | 'transfer' | 'payment' | 'deposit' | 'withdrawal';
  description: string;
  date: string;
  amount: string;
  balance?: string;
};

export function TransactionListItem({
  type,
  description,
  date,
  amount,
  balance,
}: TransactionListItemProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  const isCredit = type === 'credit' || type === 'deposit';
  const iconName = isCredit ? 'trending' : 'trending';
  const iconRotation = isCredit ? '' : 'rotate-180';

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl transition-colors hover:scale-[1.01] ${
        currentTheme === 'dark'
          ? 'bg-gray-900/30 hover:bg-gray-900/50'
          : 'bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center gap-4 flex-1">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isCredit
              ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20'
              : 'bg-gradient-to-br from-gray-500/20 to-gray-600/20'
          }`}
        >
          <Icon
            name={iconName}
            className={`${iconRotation} ${
              isCredit ? 'text-teal-400' : 'text-gray-400'
            }`}
          />
        </div>

        <div className="flex-1">
          <p
            className={`font-medium ${
              currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {description}
          </p>
          <p
            className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {date}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p
          className={`font-semibold text-lg ${
            isCredit ? 'text-teal-400' : 'text-gray-400'
          }`}
        >
          {isCredit ? '+' : '-'} {amount}
        </p>
        {balance && (
          <p
            className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            {balance}
          </p>
        )}
      </div>
    </div>
  );
}
