'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Icon } from '@/components/ui/Icon';

type PositionCardProps = {
  symbol: string;
  name: string;
  assetType: 'stock' | 'crypto' | 'etf' | 'commodity';
  quantity: number;
  avgPrice: string;
  currentPrice: string;
  totalValue: string;
  gainLoss: string;
  gainLossPercent: string;
  labels: {
    quantity: string;
    avgPrice: string;
    currentPrice: string;
    totalValue: string;
  };
};

export function PositionCard({
  symbol,
  name,
  assetType,
  quantity,
  avgPrice,
  currentPrice,
  totalValue,
  gainLoss,
  gainLossPercent,
  labels,
}: PositionCardProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  const isPositive = gainLoss.startsWith('+') || !gainLoss.startsWith('-');
  const iconColor = isPositive ? 'text-teal-400' : 'text-red-400';
  const textColor = isPositive ? 'text-teal-400' : 'text-red-400';

  const assetIcons = {
    stock: 'trending',
    crypto: 'wallet',
    etf: 'chart',
    commodity: 'globe',
  } as const;

  return (
    <div
      className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] ${
        currentTheme === 'dark'
          ? 'bg-gray-900/50 border-gray-800 hover:border-teal-500/50'
          : 'bg-white border-gray-200 hover:border-teal-500/50'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              currentTheme === 'dark'
                ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20'
                : 'bg-gradient-to-br from-teal-500/10 to-cyan-500/10'
            }`}
          >
            <Icon name={assetIcons[assetType]} className="text-teal-400" />
          </div>

          <div>
            <h3
              className={`text-lg font-bold ${
                currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              {symbol}
            </h3>
            <p
              className={`text-sm ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {name}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className={`text-lg font-bold ${textColor}`}>{gainLoss}</p>
          <p className={`text-sm ${textColor}`}>{gainLossPercent}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p
            className={`text-xs ${
              currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            {labels.quantity}
          </p>
          <p
            className={`text-sm font-semibold ${
              currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {quantity}
          </p>
        </div>

        <div>
          <p
            className={`text-xs ${
              currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            {labels.avgPrice}
          </p>
          <p
            className={`text-sm font-semibold ${
              currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {avgPrice}
          </p>
        </div>

        <div>
          <p
            className={`text-xs ${
              currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            {labels.currentPrice}
          </p>
          <p
            className={`text-sm font-semibold ${
              currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {currentPrice}
          </p>
        </div>

        <div>
          <p
            className={`text-xs ${
              currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            {labels.totalValue}
          </p>
          <p className="text-sm font-semibold text-teal-400">{totalValue}</p>
        </div>
      </div>
    </div>
  );
}
