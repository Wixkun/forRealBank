import { getTranslations } from 'next-intl/server';
import { BrokeragePageWrapper } from '@/components/templates/BrokeragePageWrapper';

type PageProps = {
  params: Promise<{
    locale: string;
    accountId: string;
  }>;
};

export default async function BrokeragePage({ params }: PageProps) {
  const { locale, accountId } = await params;
  const t = await getTranslations({ locale, namespace: 'brokerage' });

  const accountData = {
    id: accountId,
    name: 'Trading Account',
    type: t('title'),
  };

  const positions = [
    {
      id: '1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'stock' as const,
      quantity: 50,
      avgPrice: '€145.30',
      currentPrice: '€178.50',
      totalValue: '€8,925.00',
      gainLoss: '+€1,660.00',
      gainLossPercent: '+22.86%',
    },
    {
      id: '2',
      symbol: 'BTC',
      name: 'Bitcoin',
      assetType: 'crypto' as const,
      quantity: 0.5,
      avgPrice: '€35,000.00',
      currentPrice: '€42,000.00',
      totalValue: '€21,000.00',
      gainLoss: '+€3,500.00',
      gainLossPercent: '+20.00%',
    },
    {
      id: '3',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      assetType: 'stock' as const,
      quantity: 30,
      avgPrice: '€320.00',
      currentPrice: '€378.85',
      totalValue: '€11,365.50',
      gainLoss: '+€1,765.50',
      gainLossPercent: '+18.39%',
    },
    {
      id: '4',
      symbol: 'ETH',
      name: 'Ethereum',
      assetType: 'crypto' as const,
      quantity: 5,
      avgPrice: '€1,800.00',
      currentPrice: '€2,250.00',
      totalValue: '€11,250.00',
      gainLoss: '+€2,250.00',
      gainLossPercent: '+25.00%',
    },
    {
      id: '5',
      symbol: 'SPY',
      name: 'SPDR S&P 500 ETF',
      assetType: 'etf' as const,
      quantity: 25,
      avgPrice: '€410.00',
      currentPrice: '€448.20',
      totalValue: '€11,205.00',
      gainLoss: '+€955.00',
      gainLossPercent: '+9.32%',
    },
    {
      id: '6',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      assetType: 'stock' as const,
      quantity: 15,
      avgPrice: '€230.00',
      currentPrice: '€245.50',
      totalValue: '€3,682.50',
      gainLoss: '+€232.50',
      gainLossPercent: '+6.74%',
    },
    {
      id: '7',
      symbol: 'GOLD',
      name: 'Gold Futures',
      assetType: 'commodity' as const,
      quantity: 10,
      avgPrice: '€1,850.00',
      currentPrice: '€2,020.00',
      totalValue: '€20,200.00',
      gainLoss: '+€1,700.00',
      gainLossPercent: '+9.19%',
    },
    {
      id: '8',
      symbol: 'SOL',
      name: 'Solana',
      assetType: 'crypto' as const,
      quantity: 100,
      avgPrice: '€95.00',
      currentPrice: '€108.23',
      totalValue: '€10,823.00',
      gainLoss: '+€1,323.00',
      gainLossPercent: '+13.93%',
    },
  ];

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
