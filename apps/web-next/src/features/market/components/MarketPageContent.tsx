'use client';

import { useMemo, useState, useEffect } from 'react';
import { useMarketData } from '@/features/market/useMarketData';
import { MarketAssetsListSection } from '@/features/market/components/MarketAssetsListSection';
import { TradeModal } from '@/features/market/components/TradeModal';

type MarketAsset = {
  symbol: string;
  name: string;
  assetType: 'stock' | 'crypto' | 'etf' | 'commodity';
  initialPrice: string;
};

type MarketPageContentProps = {
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

export function MarketPageContent({ assets, translations }: MarketPageContentProps) {
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

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">{translations.title}</h1>
          <p className="text-fg-muted text-sm">{translations.subtitle}</p>
        </div>
        {loading && <div className="text-xs text-teal-400 animate-pulse">Updating...</div>}
      </div>

      <div>
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
      </div>
    </div>
  );
}
