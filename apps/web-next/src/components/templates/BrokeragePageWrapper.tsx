'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { BrokeragePageContent } from '@/components/templates/BrokeragePageContent';

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

type BrokeragePageWrapperProps = {
  locale: string;
  accountData: {
    id: string;
    name: string;
    type: string;
  };
  positions: Position[];
  translations: {
    totalValue: string;
    totalGain: string;
    dayChange: string;
    positions: string;
    noPositions: string;
    quantity: string;
    avgPrice: string;
    currentPrice: string;
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

export function BrokeragePageWrapper(props: BrokeragePageWrapperProps) {
  const handleTrade = (data: {
    action: 'buy' | 'sell';
    symbol: string;
    quantity: number;
    orderType: 'market' | 'limit' | 'stop';
    price?: number;
  }) => {
    console.log('Trade requested:', data);
  };

  return (
    <ThemeProvider>
      <BrokeragePageContent 
        {...props} 
        initialPositions={props.positions}
        onTrade={handleTrade} 
      />
    </ThemeProvider>
  );
}
