'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { BrokeragePageHeader } from '@/components/organisms/BrokeragePageHeader';
import { PortfolioSummaryCard } from '@/components/molecules/PortfolioSummaryCard';
import { PositionsListSection } from '@/components/organisms/PositionsListSection';
import { TradingPanelSection } from '@/components/organisms/TradingPanelSection';
import { useMarketData } from '@/hooks/useMarketData';
import { useMemo, useState, useCallback } from 'react';
import { fetchTradingPositionsClient, placeTradingOrder } from '@/lib/api';

type PositionView = {
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

type RawPosition = {
  id: string;
  symbol: string;
  name: string;
  assetType: 'stock' | 'crypto' | 'etf' | 'commodity';
  quantity: number;
  avgPurchasePrice: number;
};

type BrokeragePageContentProps = {
  locale: string;
  accountData: {
    id: string;
    name: string;
    type: string;
  };
  initialPositions: PositionView[];
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

export function BrokeragePageContent({
  locale,
  accountData,
  initialPositions,
  translations,
}: BrokeragePageContentProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  const formatCurrency = useCallback(
    (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value),
    [locale]
  );

  const formatSignedCurrency = useCallback(
    (value: number) => {
      const formatted = formatCurrency(Math.abs(value));
      if (value > 0) return `+${formatted}`;
      if (value < 0) return `-${formatted}`;
      return `+${formatted}`;
    },
    [formatCurrency]
  );

  const mapPosition = useCallback(
    (pos: RawPosition): PositionView => {
      const currentPrice = pos.avgPurchasePrice;
      const totalValueNum = currentPrice * pos.quantity;
      const gainLossNum = totalValueNum - (pos.avgPurchasePrice * pos.quantity);
      const gainLossPercentNum = (gainLossNum / (pos.avgPurchasePrice * pos.quantity)) * 100;

      return {
        id: pos.id,
        symbol: pos.symbol,
        name: pos.name,
        assetType: pos.assetType,
        quantity: pos.quantity,
        avgPrice: formatCurrency(pos.avgPurchasePrice),
        currentPrice: formatCurrency(currentPrice),
        totalValue: formatCurrency(totalValueNum),
        gainLoss: formatSignedCurrency(gainLossNum),
        gainLossPercent: `${gainLossPercentNum >= 0 ? '+' : ''}${gainLossPercentNum.toFixed(2)}%`,
      };
    },
    [formatCurrency, formatSignedCurrency]
  );

  const [basePositions, setBasePositions] = useState<PositionView[]>(initialPositions);

  const symbols = useMemo(() => basePositions.map(p => p.symbol), [basePositions]);
  const { data: marketData, loading } = useMarketData(symbols, 30000);

  const updatedPositions = useMemo(() => {
    return basePositions.map(position => {
      const liveData = marketData[position.symbol];
      if (!liveData) return position;

      const avgPriceNum = parseFloat(position.avgPrice.replace(/[€,]/g, ''));
      const currentPrice = liveData.price;
      const totalValue = currentPrice * position.quantity;
      const gainLoss = totalValue - (avgPriceNum * position.quantity);
      const gainLossPercent = ((gainLoss / (avgPriceNum * position.quantity)) * 100);

      return {
        ...position,
        currentPrice: formatCurrency(currentPrice),
        totalValue: formatCurrency(totalValue),
        gainLoss: formatSignedCurrency(gainLoss),
        gainLossPercent: `${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(2)}%`,
      };
    });
  }, [basePositions, marketData, formatCurrency, formatSignedCurrency]);

  const portfolioData = useMemo(() => {
    const totalValue = updatedPositions.reduce((sum, p) => {
      return sum + parseFloat(p.totalValue.replace(/[€,]/g, ''));
    }, 0);

    const totalCost = updatedPositions.reduce((sum, p) => {
      const avgPrice = parseFloat(p.avgPrice.replace(/[€,]/g, ''));
      return sum + (avgPrice * p.quantity);
    }, 0);

    const totalGain = totalValue - totalCost;
    const totalGainPercent = ((totalGain / totalCost) * 100);

    const dayChangeValue = updatedPositions.reduce((sum, p) => {
      const liveData = marketData[p.symbol];
      if (!liveData) return sum;
      const currentValue = parseFloat(p.totalValue.replace(/[€,]/g, ''));
      return sum + (currentValue * (liveData.change24h / 100));
    }, 0);

    const dayChangePercent = (dayChangeValue / totalValue) * 100;

    return {
      totalValue: `€${totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`,
      totalGain: `${totalGain >= 0 ? '+' : ''}€${Math.abs(totalGain).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`,
      totalGainPercent: `${totalGainPercent >= 0 ? '+' : ''}${totalGainPercent.toFixed(2)}%`,
      dayChange: `${dayChangeValue >= 0 ? '+' : ''}€${Math.abs(dayChangeValue).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`,
      dayChangePercent: `${dayChangePercent >= 0 ? '+' : ''}${dayChangePercent.toFixed(2)}%`,
    };
  }, [updatedPositions, marketData]);

  const handleTrade = useCallback(async (data: {
    action: 'buy' | 'sell';
    symbol: string;
    quantity: number;
    orderType: 'market' | 'limit' | 'stop';
    price?: number;
  }) => {
    try {
      await placeTradingOrder({
        accountId: accountData.id,
        symbol: data.symbol.toUpperCase(),
        side: data.action,
        quantity: data.quantity,
        orderType: data.orderType,
        price: data.price,
      });

      const fresh: RawPosition[] = await fetchTradingPositionsClient(accountData.id);
      const mapped = fresh.map((pos) => mapPosition(pos));
      setBasePositions(mapped);
    } catch (error) {
      console.error('Trade failed', error);
      alert('Order failed. Please try again.');
    }
  }, [accountData.id, mapPosition]);

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
        <div className="mb-8 relative">
          {loading && (
            <div className="absolute top-2 right-2 text-xs text-teal-400 animate-pulse">
              Updating...
            </div>
          )}
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
              positions={updatedPositions}
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
              onTrade={handleTrade}
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
