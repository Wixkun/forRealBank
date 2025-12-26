import { getTranslations } from 'next-intl/server';
import { BrokeragePageWrapper } from '@/components/templates/BrokeragePageWrapper';
import { getBrokerageAccount, getTradingPositions, getMarketPrices } from '@/lib/server-api';
import { redirect } from 'next/navigation';

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

type PageProps = {
  params: Promise<{
    locale: string;
    accountId: string;
  }>;
};

export default async function BrokeragePage({ params }: PageProps) {
  const { locale, accountId } = await params;
  const t = await getTranslations({ locale, namespace: 'brokerage' });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);

  const formatSignedCurrency = (value: number) => {
    const formatted = formatCurrency(Math.abs(value));
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
    return `+${formatted}`;
  };

  let account: BrokerageAccount | null = null;
  let positions: TradingPosition[] = [];
  let formattedPositions: Position[] = [];

  try {
    account = await getBrokerageAccount(accountId);
    positions = await getTradingPositions(accountId);
    const priceMap = await getMarketPrices(positions.map((p: TradingPosition) => p.symbol));

    formattedPositions = positions.map((pos) => {
      const live = priceMap[pos.symbol];
      const currentPrice = live?.price ?? pos.avgPurchasePrice;
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
    });
  } catch {
    redirect('/login');
  }

  if (!account) {
    redirect('/login');
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
      positions={formattedPositions}
      translations={translations}
    />
  );
}
