'use client';

import { useTheme } from '@/contexts/ThemeContext';

type AccountDetailsCardProps = {
  accountName: string;
  accountNumber: string;
  iban: string;
  openedOn: string;
  status: string;
  labels: {
    accountNumber: string;
    iban: string;
    openedOn: string;
    status: string;
  };
};

export function AccountDetailsCard({
  accountName,
  accountNumber,
  iban,
  openedOn,
  status,
  labels,
}: AccountDetailsCardProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  return (
    <div
      className={`p-6 rounded-2xl border transition-colors ${
        currentTheme === 'dark'
          ? 'bg-gray-900/50 border-gray-800'
          : 'bg-white border-gray-200'
      }`}
    >
      <h3
        className={`text-xl font-semibold mb-4 ${
          currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}
      >
        {accountName}
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span
            className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {labels.accountNumber}
          </span>
          <span
            className={`text-sm font-mono ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'
            }`}
          >
            {accountNumber}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span
            className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {labels.iban}
          </span>
          <span
            className={`text-sm font-mono ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'
            }`}
          >
            {iban}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span
            className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {labels.openedOn}
          </span>
          <span
            className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'
            }`}
          >
            {openedOn}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span
            className={`text-sm ${
              currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {labels.status}
          </span>
          <span className="text-sm font-semibold text-teal-400">{status}</span>
        </div>
      </div>
    </div>
  );
}
