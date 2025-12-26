'use client';

import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Icon } from '@/components/ui/Icon';
import Image from 'next/image';

type MarketAssetCardProps = {
  symbol: string;
  name: string;
  assetType: 'stock' | 'crypto' | 'etf' | 'commodity';
  currentPrice: string;
  change24h: string;
  change24hPercent: string;
  volume?: string;
  logoUrl?: string;
  onTrade: (symbol: string) => void;
  labels: {
    trade: string;
  };
};

export function MarketAssetCard({
  symbol,
  name,
  assetType,
  currentPrice,
  change24h,
  change24hPercent,
  volume,
  logoUrl,
  onTrade,
  labels,
}: MarketAssetCardProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  const assetIcons = {
    stock: 'trending',
    crypto: 'wallet',
    etf: 'chart',
    commodity: 'globe',
  } as const;

  const changePercentValue = useMemo(() => {
    const num = Number(change24hPercent.replace(/[^-0-9.]/g, ''));
    return Number.isFinite(num) ? num : 0;
  }, [change24hPercent]);

  const isPositive = changePercentValue >= 0;

  const sparkValues = useMemo(() => {
    const base = Number(currentPrice.replace(/[^0-9.-]/g, '')) || 100;
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const points = Array.from({ length: 12 }, (_, idx) => {
      const noise = Math.sin(seed + idx * 1.37) * 0.5 + 0.5;
      const trend = 1 + (changePercentValue / 100) * (idx / 11);
      const jitter = 1 + (noise - 0.5) * 0.04;
      return base * trend * jitter;
    });
    return points;
  }, [symbol, currentPrice, changePercentValue]);

  const sparkPoints = useMemo(() => {
    const width = 120;
    const height = 48;
    const max = Math.max(...sparkValues);
    const min = Math.min(...sparkValues);
    const range = max - min || 1;

    return sparkValues
      .map((v, idx) => {
        const x = (idx / (sparkValues.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [sparkValues]);

  return (
    <div
          className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] animate-row-enter ${
        currentTheme === 'dark'
          ? 'bg-gray-900/60 border-gray-800 hover:border-teal-500/50'
          : 'bg-white border-gray-200 hover:border-teal-500/50'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${name} logo`}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-contain border border-gray-700/40 bg-white/5"
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                currentTheme === 'dark'
                  ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20'
                  : 'bg-gradient-to-br from-teal-500/10 to-cyan-500/10'
              }`}
            >
              <Icon name={assetIcons[assetType]} className="text-teal-400" />
            </div>
          )}
          <div className="min-w-0">
            <h3
              className={`text-lg font-bold truncate ${
                currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              {symbol}
            </h3>
            <p
              className={`text-sm truncate ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {name}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p
            className={`text-xl font-bold ${
              currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {currentPrice}
          </p>
          <p className={`text-sm font-semibold ${isPositive ? 'text-teal-400' : 'text-red-400'}`}>
            {change24h} ({change24hPercent})
          </p>
        </div>

        <div className="hidden sm:block">
          <svg width="120" height="48" viewBox="0 0 120 48" role="img" aria-label="price sparkline">
            <polyline
              points={sparkPoints}
              fill="none"
              stroke={isPositive ? '#2dd4bf' : '#f87171'}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sparkline-animate"
            />
          </svg>
        </div>
      </div>

      {volume && (
        <div className="mt-3 mb-4 text-xs text-gray-500">
          24h Vol: {volume}
        </div>
      )}

      <button
        onClick={() => onTrade(symbol)}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold transition-all hover:scale-[1.01]"
      >
        {labels.trade}
      </button>
    </div>
  );
}
