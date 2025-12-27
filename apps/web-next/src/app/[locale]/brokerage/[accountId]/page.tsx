'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BrokeragePageWrapper } from '@/components/templates/BrokeragePageWrapper';
import { useEffect, useState } from 'react';

type BrokerageAccount = {
  id: string;
  name: string;
  status?: string;
};

type TradingPosition = {
  id: string;
  symbol: string;
  name: string;
  assetType: 'stock' | 'crypto' | 'etf' | 'commodity';
  quantity: number;
  avgPurchasePrice: number;
};

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

export default function BrokeragePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  const accountId = params?.accountId as string;
  const t = useTranslations('brokerage');
  const tCommon = useTranslations('common');

  const [account, setAccount] = useState<BrokerageAccount | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch brokerage account
        const accountRes = await fetch(`/api/proxy/accounts/brokerage/${accountId}`);
        if (!accountRes.ok) {
          if (accountRes.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error(`Failed to fetch account: ${accountRes.status}`);
        }
        const accountData = await accountRes.json();
        setAccount(accountData);

        // Fetch trading positions
        const posRes = await fetch(`/api/proxy/trading/positions/${accountId}`);
        if (posRes.ok) {
          const positionsData: TradingPosition[] = await posRes.json();
          
          // Fetch market prices
          const symbols = positionsData.map(p => p.symbol).join(',');
          const pricesRes = await fetch(`/api/market-data?symbols=${symbols}`);
          const priceMap: Record<string, { price: number }> = pricesRes.ok 
            ? (await pricesRes.json()).data || {}
            : {};

          // Format positions
          const formattedPositions = positionsData.map((pos) => {
            const live = priceMap[pos.symbol];
            const currentPrice = live?.price ?? pos.avgPurchasePrice;
            const totalValueNum = currentPrice * pos.quantity;
            const gainLossNum = totalValueNum - (pos.avgPurchasePrice * pos.quantity);
            const gainLossPercentNum = (gainLossNum / (pos.avgPurchasePrice * pos.quantity)) * 100;

            console.log(`[${pos.symbol}] avg: ${pos.avgPurchasePrice}, current: ${currentPrice}, qty: ${pos.quantity}, gain: ${gainLossNum}`);

            const formatCurrency = (value: number) =>
              new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);

            const formatSignedCurrency = (value: number) => {
              const formatted = formatCurrency(Math.abs(value));
              if (value > 0) return `+${formatted}`;
              if (value < 0) return `-${formatted}`;
              return `+${formatted}`;
            };

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
          });

          setPositions(formattedPositions);
        }
      } catch (err) {
        console.error('[Brokerage Page] Error loading account:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchData();
    }
  }, [accountId, locale, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-800">
        <div className="text-white text-lg">{tCommon('loadingAccount')}</div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-800">
        <div className="text-white">
          <div className="text-lg mb-2">{tCommon('errorLoadingAccount')}</div>
          <div className="text-sm text-gray-300">ID: {accountId}</div>
          {error && <div className="text-sm text-red-300 mt-2">{error}</div>}
        </div>
      </div>
    );
  }

  const accountData = {
    id: account.id,
    name: account.name,
    type: t('title'),
  };

  const translations = {
    totalValue: t('totalValue'),
    totalGain: t('totalGain'),
    dayChange: t('dayChange'),
    positions: t('positions'),
    noPositions: t('noPositions'),
    quantity: t('quantity'),
    avgPrice: t('avgPrice'),
    currentPrice: t('currentPrice'),
    trade: t('trade'),
    buy: t('buy'),
    sell: t('sell'),
    tradeSymbol: t('tradeSymbol'),
    tradeQuantity: t('tradeQuantity'),
    orderType: 'Order Type',
    tradePrice: t('tradePrice'),
    placeOrder: t('placeOrder'),
    orderTypes: {
      market: t('orderTypes.market'),
      limit: t('orderTypes.limit'),
      stop: t('orderTypes.stop'),
    },
  };

  return (
    <BrokeragePageWrapper
      locale={locale}
      accountData={accountData}
      positions={positions}
      translations={translations}
    />
  );
}
