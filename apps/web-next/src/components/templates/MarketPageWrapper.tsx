'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { MarketPageContent } from '@/components/templates/MarketPageContent';

type MarketAsset = {
  symbol: string;
  name: string;
  assetType: 'stock' | 'crypto' | 'etf' | 'commodity';
  initialPrice: string;
};

type MarketPageWrapperProps = {
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

export function MarketPageWrapper(props: MarketPageWrapperProps) {
  return (
    <ThemeProvider>
      <MarketPageContent {...props} />
    </ThemeProvider>
  );
}
