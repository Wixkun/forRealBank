'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { MarketAssetCard } from '@/components/molecules/MarketAssetCard';

type Asset = {
  symbol: string;
  name: string;
  assetType: 'stock' | 'crypto' | 'etf' | 'commodity';
  currentPrice: string;
  change24h: string;
  change24hPercent: string;
  volume?: string;
  logoUrl?: string;
};

type MarketAssetsListSectionProps = {
  assets: Asset[];
  onTrade: (symbol: string) => void;
  labels: {
    title: string;
    filters: {
      all: string;
      stocks: string;
      crypto: string;
      etf: string;
      commodities: string;
    };
    trade: string;
  };
};

export function MarketAssetsListSection({
  assets,
  onTrade,
  labels,
}: MarketAssetsListSectionProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';
  const [filter, setFilter] = useState<'all' | 'stock' | 'crypto' | 'etf' | 'commodity'>('all');

  const filteredAssets = assets.filter((asset) => {
    if (filter === 'all') return true;
    return asset.assetType === filter;
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2
          className={`text-2xl font-bold ${
            currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          {labels.title}
        </h2>

        <div className="flex gap-2 flex-wrap">
          {(['all', 'stock', 'crypto', 'etf', 'commodity'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === filterType
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white'
                  : currentTheme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterType === 'all' && labels.filters.all}
              {filterType === 'stock' && labels.filters.stocks}
              {filterType === 'crypto' && labels.filters.crypto}
              {filterType === 'etf' && labels.filters.etf}
              {filterType === 'commodity' && labels.filters.commodities}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredAssets.map((asset) => (
          <MarketAssetCard
            key={asset.symbol}
            {...asset}
            onTrade={onTrade}
            labels={{ trade: labels.trade }}
          />
        ))}
      </div>
    </section>
  );
}
