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

async function apiCallWithAuth<T>(
  endpoint: string,
  token: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown,
  errorMessage: string = 'API request failed',
): Promise<T> {
  const options: FetchOptions = {
    method,
    headers: { Authorization: `Bearer ${token}` },
  };

  if (body) {
    options.body = JSON.stringify(body);
    (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  return apiCall<T>(endpoint, options, errorMessage);
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

export async function fetchAccountsData(token: string) {
  return apiCallWithAuth<unknown>('/accounts', token, 'GET', undefined, 'Failed to fetch accounts');
}

export async function fetchRecentTransactions(token: string, limit: number = 5) {
  return apiCallWithAuth<unknown>(
    `/transactions/recent?limit=${limit}`,
    token,
    'GET',
    undefined,
    'Failed to fetch transactions',
  );
}

export async function fetchAccountTransactions(
  accountId: string,
  token: string,
  limit: number = 50,
  type?: string,
) {
  const endpoint = `/transactions/account/${accountId}?limit=${limit}${type && type !== 'all' ? `&type=${type}` : ''}`;
  return apiCallWithAuth<unknown>(
    endpoint,
    token,
    'GET',
    undefined,
    'Failed to fetch account transactions',
  );
}

export async function fetchTradingPositions(accountId: string, token: string) {
  return apiCallWithAuth<unknown>(
    `/trading/positions/${accountId}`,
    token,
    'GET',
    undefined,
    'Failed to fetch trading positions',
  );
}

export async function fetchBankAccount(accountId: string, token: string) {
  return apiCallWithAuth<unknown>(
    `/accounts/bank/${accountId}`,
    token,
    'GET',
    undefined,
    'Failed to fetch bank account',
  );
}

export async function fetchBrokerageAccount(accountId: string, token: string) {
  return apiCallWithAuth<unknown>(
    `/accounts/brokerage/${accountId}`,
    token,
    'GET',
    undefined,
    'Failed to fetch brokerage account',
  );
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
