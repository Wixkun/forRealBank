import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketAssetEntity } from '@forreal/infrastructure-typeorm';

export type SupportedAssetType = 'stock' | 'crypto' | 'etf';
export type QuoteSource = 'twelve_data' | 'simulated';

export type MarketQuote = {
  price: number;
  changePercent: number;
  currency: 'EUR';
  source: QuoteSource;
  asOf: string;
};

export type HistoryPoint = { date: string; price: number };
export type HistoryPeriod = '1d' | '1m' | '1y';

const FALLBACK_QUOTES: Record<string, { price: number; changePercent: number }> = {
  AAPL: { price: 198.42, changePercent: 1.24 },
  AMZN: { price: 210.18, changePercent: 0.76 },
  BTC: { price: 58520.35, changePercent: 2.81 },
  ETH: { price: 3054.72, changePercent: -0.63 },
  GOOGL: { price: 176.31, changePercent: 1.05 },
  MSFT: { price: 428.67, changePercent: -0.28 },
  QQQ: { price: 474.12, changePercent: 0.44 },
  SOL: { price: 132.48, changePercent: 4.16 },
  SPY: { price: 548.26, changePercent: 0.32 },
  TSLA: { price: 245.73, changePercent: -1.92 },
};

const PERIODS: Record<
  HistoryPeriod,
  { interval: string; outputsize: number; fallbackPoints: number; stepMs: number }
> = {
  '1d': { interval: '5min', outputsize: 78, fallbackPoints: 48, stepMs: 30 * 60_000 },
  '1m': { interval: '1day', outputsize: 30, fallbackPoints: 30, stepMs: 86_400_000 },
  '1y': { interval: '1day', outputsize: 365, fallbackPoints: 52, stepMs: 7 * 86_400_000 },
};

type TwelveQuoteResponse = {
  close?: string;
  percent_change?: string;
  currency?: string;
  datetime?: string;
  message?: string;
  status?: string;
};

type TwelveSeriesResponse = {
  meta?: { currency?: string };
  values?: Array<{ datetime?: string; close?: string }>;
  message?: string;
  status?: string;
};

@Injectable()
export class MarketDataService {
  private readonly apiKey: string;
  private readonly cache = new Map<string, { expiresAt: number; value: unknown }>();

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('TWELVE_DATA_API_KEY')?.trim() ?? '';
  }

  getDisplayQuote(asset: MarketAssetEntity): MarketQuote {
    return this.getCached<MarketQuote>(`quote:${asset.symbol}`) ?? this.fallbackQuote(asset.symbol);
  }

  async getQuote(asset: MarketAssetEntity): Promise<MarketQuote> {
    const cacheKey = `quote:${asset.symbol}`;
    const cached = this.getCached<MarketQuote>(cacheKey);
    if (cached) return cached;

    if (this.apiKey) {
      try {
        const providerSymbol = this.providerSymbol(asset);
        const response = await this.request<TwelveQuoteResponse>('/quote', {
          symbol: providerSymbol,
        });
        const rawPrice = Number(response.close);
        if (!Number.isFinite(rawPrice) || rawPrice <= 0) throw new Error('Invalid quote');
        const rate = await this.euroRate(response.currency);
        const quote: MarketQuote = {
          price: roundMoney(rawPrice * rate),
          changePercent: roundPercent(Number(response.percent_change) || 0),
          currency: 'EUR',
          source: 'twelve_data',
          asOf: response.datetime || new Date().toISOString(),
        };
        this.setCached(cacheKey, quote, 60_000);
        return quote;
      } catch {
        // Le trading reste disponible avec une indication explicite du fallback.
      }
    }

    return this.fallbackQuote(asset.symbol);
  }

  async getHistory(asset: MarketAssetEntity, period: HistoryPeriod) {
    const cacheKey = `history:${asset.symbol}:${period}`;
    const cached = this.getCached<{ points: HistoryPoint[]; quote: MarketQuote }>(cacheKey);
    if (cached) return cached;

    if (this.apiKey) {
      try {
        const settings = PERIODS[period];
        const response = await this.request<TwelveSeriesResponse>('/time_series', {
          symbol: this.providerSymbol(asset),
          interval: settings.interval,
          outputsize: String(settings.outputsize),
          timezone: 'Europe/Paris',
        });
        if (!response.values?.length) throw new Error('Empty history');
        const rate = await this.euroRate(response.meta?.currency);
        const points = response.values
          .map((value) => ({
            date: value.datetime ?? '',
            price: roundMoney(Number(value.close) * rate),
          }))
          .filter((point) => point.date && Number.isFinite(point.price) && point.price > 0)
          .reverse();
        if (!points.length) throw new Error('Invalid history');
        const previous = points.at(-2)?.price ?? points[0].price;
        const latest = points.at(-1)!;
        const quote: MarketQuote = {
          price: latest.price,
          changePercent:
            previous > 0 ? roundPercent(((latest.price - previous) / previous) * 100) : 0,
          currency: 'EUR',
          source: 'twelve_data',
          asOf: latest.date,
        };
        const result = { points, quote };
        this.setCached(cacheKey, result, period === '1d' ? 60_000 : 15 * 60_000);
        this.setCached(`quote:${asset.symbol}`, quote, 60_000);
        return result;
      } catch {
        // Fallback déterministe ci-dessous.
      }
    }

    const quote = this.fallbackQuote(asset.symbol);
    return { points: this.fallbackHistory(asset.symbol, period, quote), quote };
  }

  private providerSymbol(asset: MarketAssetEntity) {
    return asset.assetType === 'crypto' ? `${asset.symbol}/EUR` : asset.symbol;
  }

  private async euroRate(currency?: string) {
    if (!currency || currency.toUpperCase() === 'EUR') return 1;
    const pair = `${currency.toUpperCase()}/EUR`;
    const cacheKey = `fx:${pair}`;
    const cached = this.getCached<number>(cacheKey);
    if (cached) return cached;
    const response = await this.request<TwelveQuoteResponse>('/quote', { symbol: pair });
    const rate = Number(response.close);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid FX rate');
    this.setCached(cacheKey, rate, 30 * 60_000);
    return rate;
  }

  private async request<T>(path: string, parameters: Record<string, string>): Promise<T> {
    const query = new URLSearchParams({ ...parameters, apikey: this.apiKey });
    const response = await fetch(`https://api.twelvedata.com${path}?${query}`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`Market provider HTTP ${response.status}`);
    const payload = (await response.json()) as T & { status?: string; message?: string };
    if (payload.status === 'error') throw new Error(payload.message || 'Market provider error');
    return payload;
  }

  private fallbackQuote(symbol: string): MarketQuote {
    const quote = FALLBACK_QUOTES[symbol.toUpperCase()] ?? { price: 100, changePercent: 0 };
    return {
      ...quote,
      currency: 'EUR',
      source: 'simulated',
      asOf: new Date().toISOString(),
    };
  }

  private fallbackHistory(
    symbol: string,
    period: HistoryPeriod,
    quote: MarketQuote,
  ): HistoryPoint[] {
    const settings = PERIODS[period];
    const seed = [...symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const now = Date.now();
    return Array.from({ length: settings.fallbackPoints }, (_, index) => {
      const distance = settings.fallbackPoints - 1 - index;
      const trend = 1 - (quote.changePercent / 100) * (distance / settings.fallbackPoints);
      const wave = 1 + Math.sin((index + seed) * 0.72) * 0.012;
      return {
        date: new Date(now - distance * settings.stepMs).toISOString(),
        price: roundMoney(quote.price * trend * wave),
      };
    });
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  private setCached(key: string, value: unknown, ttlMs: number) {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

export function isSupportedAssetType(type: string): type is SupportedAssetType {
  return type === 'stock' || type === 'crypto' || type === 'etf';
}

export function roundMoney(value: number) {
  return Math.round((value + 1e-9) * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round((value + 1e-9) * 100) / 100;
}
