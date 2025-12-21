import { NextRequest } from 'next/server';

export const revalidate = 3600;

type Asset = {
  symbol: string;
  type: 'stock' | 'crypto' | 'etf' | 'commodity';
};

const knownCrypto: Record<string, string> = {
  BTC: 'bitcoin.org',
  ETH: 'ethereum.org',
  SOL: 'solana.com',
  USDT: 'tether.to',
  BNB: 'bnbchain.org',
  ADA: 'cardano.org',
  DOGE: 'dogecoin.com',
  MATIC: 'polygon.technology',
  DOT: 'polkadot.network',
  AVAX: 'avax.network',
};

const stockDomains: Record<string, string> = {
  AAPL: 'apple.com',
  MSFT: 'microsoft.com',
  TSLA: 'tesla.com',
  GOOGL: 'google.com',
  GOOG: 'google.com',
  AMZN: 'amazon.com',
  META: 'meta.com',
  NFLX: 'netflix.com',
  NVDA: 'nvidia.com',
  JPM: 'jpmorganchase.com',
  V: 'visa.com',
  MA: 'mastercard.com',
  BAC: 'bankofamerica.com',
  DIS: 'disney.com',
  KO: 'coca-cola.com',
  PEP: 'pepsico.com',
  NKE: 'nike.com',
  COST: 'costco.com',
  ORCL: 'oracle.com',
  INTC: 'intel.com',
  AMD: 'amd.com',
  IBM: 'ibm.com',
  PYPL: 'paypal.com',
  T: 'att.com',
  PFE: 'pfizer.com',
  MRK: 'merck.com',
  UNH: 'uhc.com',
  WMT: 'walmart.com',
  HD: 'homedepot.com',
  XOM: 'exxon.com',
  CVX: 'chevron.com'
};

const etfDomains: Record<string, string> = {
  SPY: 'spdrs.com',
  QQQ: 'invesco.com',
  VOO: 'vanguard.com',
  IVV: 'ishares.com',
  IWM: 'ishares.com',
  EEM: 'ishares.com',
  DIA: 'spdrs.com',
  XLF: 'spdrs.com',
  XLK: 'spdrs.com',
  XLE: 'spdrs.com',
  XLY: 'spdrs.com'
};

async function resolveCrypto(symbol: string): Promise<string | undefined> {
  const s = symbol.toUpperCase();
  const domain = knownCrypto[s];
  if (domain) {
    return `https://unavatar.io/${domain}`;
  }
  try {
    const resp = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(s)}`);
    const json = await resp.json();
    const thumb = json?.coins?.[0]?.thumb as string | undefined;
    return thumb || undefined;
  } catch {
    return undefined;
  }
}

async function resolveStock(symbol: string): Promise<string | undefined> {
  const s = symbol.toUpperCase();
  const domain = stockDomains[s];
  if (domain) {
    return `https://unavatar.io/${domain}?fallback=https://logo.clearbit.com/${domain}`;
  }
  return `https://s3-symbol-logo.tradingview.com/${s.toLowerCase()}.svg`;
}

async function resolveEtf(symbol: string): Promise<string | undefined> {
  const s = symbol.toUpperCase();
  const domain = etfDomains[s];
  if (domain) return `https://unavatar.io/${domain}?fallback=https://logo.clearbit.com/${domain}`;
  return `https://s3-symbol-logo.tradingview.com/${s.toLowerCase()}.svg`;
}

async function resolveCommodity(symbol: string): Promise<string | undefined> {
  const s = symbol.toUpperCase();
  if (s === 'GOLD') return 'https://unavatar.io/gold.org';
  if (s === 'SILVER') return 'https://unavatar.io/silverinstitute.org';
  if (s === 'OIL' || s === 'WTI' || s === 'BRENT') return 'https://unavatar.io/opec.org';
  return undefined;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const assetsParam = searchParams.get('assets');
  if (!assetsParam) {
    return new Response(JSON.stringify({ success: false, error: 'Missing assets' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let assets: Asset[] = [];
  try {
    assets = JSON.parse(assetsParam);
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid assets JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results: Record<string, string | undefined> = {};
  for (const a of assets) {
    let url: string | undefined;
    if (a.type === 'crypto') url = await resolveCrypto(a.symbol);
    else if (a.type === 'stock') url = await resolveStock(a.symbol);
    else if (a.type === 'etf') url = await resolveEtf(a.symbol);
    else if (a.type === 'commodity') url = await resolveCommodity(a.symbol);
    else url = undefined;
    results[a.symbol] = url;
  }

  return new Response(JSON.stringify({ success: true, logos: results }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
