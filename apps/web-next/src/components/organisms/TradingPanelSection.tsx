'use client';

import { TradeFormCard } from '@/components/molecules/TradeFormCard';

type TradingPanelSectionProps = {
  onTrade: (data: {
    action: 'buy' | 'sell';
    symbol: string;
    quantity: number;
    orderType: 'market' | 'limit' | 'stop';
    price?: number;
  }) => void;
  labels: {
    title: string;
    buy: string;
    sell: string;
    symbol: string;
    quantity: string;
    orderType: string;
    price: string;
    placeOrder: string;
    orderTypes: {
      market: string;
      limit: string;
      stop: string;
    };
  };
};

export function TradingPanelSection({ onTrade, labels }: TradingPanelSectionProps) {
  return (
    <section>
      <TradeFormCard onTrade={onTrade} labels={labels} />
    </section>
  );
}
