'use client';

import { useTheme } from '@/contexts/ThemeContext';

type PortfolioSummaryCardProps = {
  totalValue: string;
  totalGain: string;
  totalGainPercent: string;
  dayChange: string;
  dayChangePercent: string;
  labels: {
    totalValue: string;
    totalGain: string;
    dayChange: string;
  };
};

export function PortfolioSummaryCard({
  totalValue,
  totalGain,
  totalGainPercent,
  dayChange,
  dayChangePercent,
  labels,
}: PortfolioSummaryCardProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  const isTotalGainPositive = totalGain.startsWith('+') || !totalGain.startsWith('-');
  const isDayChangePositive = dayChange.startsWith('+') || !dayChange.startsWith('-');

  return (
    <div
      className={`p-8 rounded-2xl border transition-colors ${
        currentTheme === 'dark'
          ? 'bg-gradient-to-br from-gray-900/80 via-teal-900/20 to-gray-900/80 border-gray-800'
          : 'bg-gradient-to-br from-white via-teal-50/30 to-white border-gray-200'
      }`}
    >
      <p
        className={`text-sm mb-2 ${
          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}
      >
        {labels.totalValue}
      </p>
      <p className="text-4xl font-bold mb-6 bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">
        {totalValue}
      </p>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p
            className={`text-xs mb-1 ${
              currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            {labels.totalGain}
          </p>
          <p
            className={`text-xl font-semibold ${
              isTotalGainPositive ? 'text-teal-400' : 'text-red-400'
            }`}
          >
            {totalGain}
          </p>
          <p
            className={`text-sm ${
              isTotalGainPositive ? 'text-teal-400' : 'text-red-400'
            }`}
          >
            {totalGainPercent}
          </p>
        </div>

        <div>
          <p
            className={`text-xs mb-1 ${
              currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            {labels.dayChange}
          </p>
          <p
            className={`text-xl font-semibold ${
              isDayChangePositive ? 'text-teal-400' : 'text-red-400'
            }`}
          >
            {dayChange}
          </p>
          <p
            className={`text-sm ${
              isDayChangePositive ? 'text-teal-400' : 'text-red-400'
            }`}
          >
            {dayChangePercent}
          </p>
        </div>
      </div>
    </div>
  );
}
