import { ConfigService } from '@nestjs/config';
import { MarketAssetEntity } from '@forreal/infrastructure-typeorm';
import { MarketDataService } from './market-quotes';

function asset(symbol: string, assetType: 'stock' | 'crypto' | 'etf') {
  return { symbol, assetType } as MarketAssetEntity;
}

describe('MarketDataService without provider key', () => {
  const service = new MarketDataService({ get: () => undefined } as unknown as ConfigService);

  it('annonce explicitement une cotation simulée', async () => {
    const quote = await service.getQuote(asset('AAPL', 'stock'));
    expect(quote).toMatchObject({ price: 198.42, currency: 'EUR', source: 'simulated' });
  });

  it('fournit un historique graphique cohérent en fallback', async () => {
    const history = await service.getHistory(asset('BTC', 'crypto'), '1m');
    expect(history.points).toHaveLength(30);
    expect(history.points[0].date < history.points.at(-1)!.date).toBe(true);
    expect(history.points.every((point) => point.price > 0)).toBe(true);
    expect(history.quote.source).toBe('simulated');
  });
});
