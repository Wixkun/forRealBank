import { getTranslations } from 'next-intl/server';
import { MarketPageWrapper } from '@/components/templates/MarketPageWrapper';
export const revalidate = 60;

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function MarketPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'market' });

  const assets = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      assetType: 'crypto' as const,
      initialPrice: '€42,000.00',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      assetType: 'crypto' as const,
      initialPrice: '€2,250.00',
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      assetType: 'crypto' as const,
      initialPrice: '€108.23',
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'stock' as const,
      initialPrice: '€178.50',
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      assetType: 'stock' as const,
      initialPrice: '€378.85',
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      assetType: 'stock' as const,
      initialPrice: '€245.50',
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      assetType: 'stock' as const,
      initialPrice: '€142.30',
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      assetType: 'stock' as const,
      initialPrice: '€178.90',
    },
    {
      symbol: 'SPY',
      name: 'SPDR S&P 500 ETF',
      assetType: 'etf' as const,
      initialPrice: '€448.20',
    },
    {
      symbol: 'QQQ',
      name: 'Invesco QQQ Trust',
      assetType: 'etf' as const,
      initialPrice: '€395.60',
    },
    {
      symbol: 'GOLD',
      name: 'Gold Futures',
      assetType: 'commodity' as const,
      initialPrice: '€2,020.00',
    },
    {
      symbol: 'OIL',
      name: 'Crude Oil',
      assetType: 'commodity' as const,
      initialPrice: '€72.50',
    },
  ];

  const translations = {
    title: t('title'),
    subtitle: t('subtitle'),
    filters: {
      all: t('filters.all'),
      stocks: t('filters.stocks'),
      crypto: t('filters.crypto'),
      etf: t('filters.etf'),
      commodities: t('filters.commodities'),
    },
    trade: t('trade'),
    buy: t('buy'),
    sell: t('sell'),
    tradeSymbol: t('tradeSymbol'),
    tradeQuantity: t('tradeQuantity'),
    orderType: t('orderType'),
    tradePrice: t('tradePrice'),
    placeOrder: t('placeOrder'),
    orderTypes: {
      market: t('orderTypes.market'),
      limit: t('orderTypes.limit'),
      stop: t('orderTypes.stop'),
    },
  };

  return <MarketPageWrapper locale={locale} assets={assets} translations={translations} />;
}
