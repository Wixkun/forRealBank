import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const PROXY_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://forrealbank-web:3000';

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value || cookieStore.get('token')?.value;
  return token || null;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const urlObj = new URL(url);
  const path = urlObj.pathname.replace('/api/', '') + (urlObj.search ? urlObj.search : '');
  
  const proxyUrl = `${PROXY_URL}/api/proxy/${path}`;
  
  console.log('[Server-API] Using proxy:', proxyUrl, 'Original:', url);

  const response = await fetch(proxyUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error('[Server-API] Proxy error:', response.status, response.statusText);
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getAccountsData() {
  return fetchWithAuth(`${API_URL}/accounts`);
}

export async function getRecentTransactions(limit: number = 5) {
  return fetchWithAuth(`${API_URL}/transactions/recent?limit=${limit}`);
}

export async function getAccountTransactions(accountId: string, limit: number = 50, type?: string) {
  const url = type && type !== 'all'
    ? `${API_URL}/transactions/account/${accountId}?limit=${limit}&type=${type}`
    : `${API_URL}/transactions/account/${accountId}?limit=${limit}`;
  return fetchWithAuth(url);
}

export async function getTradingPositions(accountId: string) {
  return fetchWithAuth(`${API_URL}/trading/positions/${accountId}`);
}

export async function getBankAccount(accountId: string) {
  return fetchWithAuth(`${API_URL}/accounts/bank/${accountId}`);
}

export async function getBrokerageAccount(accountId: string) {
  return fetchWithAuth(`${API_URL}/accounts/brokerage/${accountId}`);
}

export async function getCurrentUser() {
  return fetchWithAuth(`${API_URL}/users/me`);
}

export async function getMarketPrices(symbols: string[]) {
  if (!symbols.length) return {};
  const params = symbols.join(',');
  const res = await fetch(`${WEB_URL}/api/market-data?symbols=${params}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch market prices');
  }
  const json = await res.json();
  return json.data || {};
}
