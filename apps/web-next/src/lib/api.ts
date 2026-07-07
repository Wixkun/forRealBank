import { BROWSER_API_BASE, buildApiUrl } from '@/lib/env';

const API_URL = buildApiUrl(BROWSER_API_BASE, '');

interface FetchOptions extends Omit<RequestInit, 'cache'> {
  cache?: RequestCache;
}

async function apiCall<T>(
  endpoint: string,
  options: FetchOptions = {},
  errorMessage: string = 'API request failed',
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    cache: 'no-store',
    ...options,
  });

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function fetchMarketAssets(type?: string) {
  const endpoint = `/market/assets${type && type !== 'all' ? `?type=${type}` : ''}`;
  return apiCall<
    Array<{
      symbol: string;
      name: string;
      assetType: 'stock' | 'crypto' | 'etf' | 'commodity';
      initialPrice: string;
    }>
  >(endpoint, {}, 'Failed to fetch market assets');
}

export async function fetchTradingPositionsClient(accountId: string) {
  return apiCall<
    Array<{
      id: string;
      symbol: string;
      name: string;
      assetType: 'stock' | 'crypto' | 'etf' | 'commodity';
      quantity: number;
      avgPurchasePrice: number;
    }>
  >(
    `/trading/positions/${accountId}`,
    { credentials: 'include' },
    'Failed to fetch trading positions',
  );
}

export async function placeTradingOrder(body: {
  accountId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  orderType: 'market' | 'limit' | 'stop';
  price?: number;
}) {
  return apiCall<unknown>(
    '/trading/orders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    },
    'Failed to place order',
  );
}
