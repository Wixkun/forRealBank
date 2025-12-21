'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { BrokeragePageHeader } from '@/components/organisms/BrokeragePageHeader';
import { PortfolioSummaryCard } from '@/components/molecules/PortfolioSummaryCard';
import { PositionsListSection } from '@/components/organisms/PositionsListSection';
import { TradingPanelSection } from '@/components/organisms/TradingPanelSection';

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

type BrokeragePageTemplateProps = {
  locale: string;
  accountData: {
    id: string;
    name: string;
    type: string;
  };
  portfolioData: {
    totalValue: string;
    totalGain: string;
    totalGainPercent: string;
    dayChange: string;
    dayChangePercent: string;
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
  onTrade: (data: {
    action: 'buy' | 'sell';
    symbol: string;
    quantity: number;
    orderType: 'market' | 'limit' | 'stop';
    price?: number;
  }) => void;
};

export function BrokeragePageTemplate({
  locale,
  accountData,
  portfolioData,
  positions,
  translations,
  onTrade,
}: BrokeragePageTemplateProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

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
      <BrokeragePageHeader
        accountName={accountData.name}
        accountType={accountData.type}
        locale={locale}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <PortfolioSummaryCard
            {...portfolioData}
            labels={{
              totalValue: translations.totalValue,
              totalGain: translations.totalGain,
              dayChange: translations.dayChange,
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PositionsListSection
              positions={positions}
              labels={{
                title: translations.positions,
                noPositions: translations.noPositions,
                quantity: translations.quantity,
                avgPrice: translations.avgPrice,
                currentPrice: translations.currentPrice,
                totalValue: translations.totalValue,
              }}
            />
          </div>

          <div>
            <TradingPanelSection
              onTrade={onTrade}
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
      </main>
    </div>
  );
}
