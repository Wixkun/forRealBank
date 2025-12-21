'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { PositionCard } from '@/components/molecules/PositionCard';

type Position = {
  id: string;
  symbol: string;
  name: string;
  assetType: 'stock' | 'crypto' | 'etf' | 'commodity';
  quantity: number;
  avgPrice: string;
  currentPrice: string;
  totalValue: string;
  gainLoss: string;
  gainLossPercent: string;
};

type PositionsListSectionProps = {
  positions: Position[];
  labels: {
    title: string;
    noPositions: string;
    quantity: string;
    avgPrice: string;
    currentPrice: string;
    totalValue: string;
  };
};

export function PositionsListSection({ positions, labels }: PositionsListSectionProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  return (
    <section>
      <h2
        className={`text-2xl font-bold mb-6 ${
          currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}
      >
        {labels.title}
      </h2>

      {positions.length === 0 ? (
        <div
          className={`text-center py-12 rounded-2xl border ${
            currentTheme === 'dark'
              ? 'bg-gray-900/30 border-gray-800 text-gray-400'
              : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}
        >
          {labels.noPositions}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {positions.map((position) => (
            <PositionCard
              key={position.id}
              {...position}
              labels={{
                quantity: labels.quantity,
                avgPrice: labels.avgPrice,
                currentPrice: labels.currentPrice,
                totalValue: labels.totalValue,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
