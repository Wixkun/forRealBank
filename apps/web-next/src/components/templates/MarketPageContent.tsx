'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMarketData } from '@/hooks/useMarketData';
import Link from 'next/link';
import { MarketAssetsListSection } from '@/components/organisms/MarketAssetsListSection';
import { TradeModal } from '@/components/molecules/TradeModal';

type MarketAsset = {
  symbol: string;
  name: string;
  assetType: 'stock' | 'crypto' | 'etf' | 'commodity';
  initialPrice: string;
};

type MarketPageContentProps = {
  locale: string;
  assets: MarketAsset[];
  translations: {
    title: string;
    subtitle: string;
    filters: {
      all: string;
      stocks: string;
      crypto: string;
      etf: string;
      commodities: string;
    };
    trade: string;
    buy: string;
    sell: string;
    tradeSymbol: string;
    tradeQuantity: string;
    orderType: string;
    tradePrice: string;
    placeOrder: string;
    orderTypes: {
      market: string;
      limit: string;
      stop: string;
    };
  };
};

export function MarketPageContent({ locale, assets, translations }: MarketPageContentProps) {
  const { theme, mounted, toggleTheme } = useTheme();
  const currentTheme = mounted ? theme : 'dark';
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState<string | undefined>(undefined);
  const [logoMap, setLogoMap] = useState<Record<string, string | undefined>>({});

  const symbols = useMemo(() => assets.map((a) => a.symbol), [assets]);
  const { data: marketData, loading } = useMarketData(symbols, 30000);

  useEffect(() => {
    const controller = new AbortController();
    const payload = assets.map((a) => ({ symbol: a.symbol, type: a.assetType }));
    const url = `/api/asset-logos?assets=${encodeURIComponent(JSON.stringify(payload))}`;
    (async () => {
      try {
        const resp = await fetch(url, { signal: controller.signal });
        const json = await resp.json();
        if (json?.success) {
          setLogoMap(json.logos || {});
        }
      } catch (err) {
        console.warn('Logo fetch failed', err);
      }
    })();
    return () => controller.abort();
  }, [assets]);

  const getLogoUrl = (assetType: 'stock' | 'crypto' | 'etf' | 'commodity', symbol: string) => {
    const s = symbol.toUpperCase();
    if (assetType === 'crypto') {
      const domainMap: Record<string, string> = {
        BTC: 'bitcoin.org',
        ETH: 'ethereum.org',
        SOL: 'solana.com',
      };
      const domain = domainMap[s];
      return domain ? `https://unavatar.io/${domain}` : undefined;
    }
    if (assetType === 'stock') {
      const domainMap: Record<string, string> = {
        AAPL: 'apple.com',
        MSFT: 'microsoft.com',
        TSLA: 'tesla.com',
        GOOGL: 'google.com',
        AMZN: 'amazon.com',
      };
      const domain = domainMap[s];
      return domain ? `https://unavatar.io/${domain}` : undefined;
    }
    if (assetType === 'etf') {
      const domainMap: Record<string, string> = {
        SPY: 'spdrs.com',
        QQQ: 'invesco.com',
      };
      const domain = domainMap[s];
      return domain ? `https://unavatar.io/${domain}` : undefined;
    }
    return undefined;
  };

  const updatedAssets = useMemo(() => {
    return assets.map((asset) => {
      const liveData = marketData[asset.symbol];
      const resolvedLogo = logoMap[asset.symbol] ?? getLogoUrl(asset.assetType, asset.symbol);
      if (!liveData) {
        return {
          ...asset,
          currentPrice: asset.initialPrice,
          change24h: '+€0.00',
          change24hPercent: '+0.00%',
          logoUrl: resolvedLogo,
        };
      }

      const changeValue = (liveData.price * liveData.change24h) / 100;

      return {
        ...asset,
        currentPrice: `€${liveData.price.toFixed(2)}`,
        change24h: `${changeValue >= 0 ? '+' : ''}€${Math.abs(changeValue).toFixed(2)}`,
        change24hPercent: `${liveData.change24h >= 0 ? '+' : ''}${liveData.change24h.toFixed(2)}%`,
        logoUrl: resolvedLogo,
      };
    });
  }, [assets, marketData, logoMap]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        currentTheme === 'dark'
          ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-black'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}
    >
      <header
        className={`border-b transition-colors ${
          currentTheme === 'dark'
            ? 'bg-gray-900/80 border-gray-800'
            : 'bg-white border-gray-200'
        } backdrop-blur-sm sticky top-0 z-50`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href={`/${locale}/dashboard`}
                className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent hover:from-teal-300 hover:to-cyan-400 transition-all"
              >
                Avenir
              </Link>

              <div className="flex items-center gap-3">
                <div
                  className={`h-8 w-px ${
                    currentTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                  }`}
                />
                <div>
                  <h1
                    className={`text-xl font-semibold ${
                      currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {translations.title}
                  </h1>
                  <p
                    className={`text-sm ${
                      currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {translations.subtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {loading && (
                <div className="text-xs text-teal-400 animate-pulse">Updating...</div>
              )}
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-xl transition-all hover:scale-110 ${
                  currentTheme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                aria-label="Toggle theme"
              >
                <span className="text-xl">{currentTheme === 'dark' ? '☀️' : '🌙'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <MarketAssetsListSection
          assets={updatedAssets}
          onTrade={(symbol) => {
            setTradeSymbol(symbol);
            setTradeOpen(true);
          }}
          labels={{
            title: translations.title,
            filters: translations.filters,
            trade: translations.trade,
          }}
        />

        <TradeModal
          open={tradeOpen}
          onClose={() => setTradeOpen(false)}
          defaultSymbol={tradeSymbol}
          onTrade={(data) => {
            console.log('Trade from market modal:', data);
            setTradeOpen(false);
          }}
          labels={{
            title: translations.trade,
            buy: translations.buy,
            sell: translations.sell,
            symbol: translations.tradeSymbol,
            quantity: translations.tradeQuantity,
            orderType: translations.orderType,
            price: translations.tradePrice,
            placeOrder: translations.placeOrder,
            orderTypes: translations.orderTypes,
          }}
        />
      </main>
    </div>
  );
}
