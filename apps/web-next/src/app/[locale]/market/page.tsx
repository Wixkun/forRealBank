import { getTranslations } from 'next-intl/server';
import { MarketPageWrapper } from '@/components/templates/MarketPageWrapper';
import { fetchMarketAssets } from '@/lib/api';
export const revalidate = 60;

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function MarketPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'market' });

  const assets = await fetchMarketAssets();

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
