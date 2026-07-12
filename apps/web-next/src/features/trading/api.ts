import { apiFetch } from '@/lib/api-client';

export type AssetType = 'stock' | 'etf' | 'crypto';

export type TradingAsset = {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  isTradable: boolean;
  price: number;
  changePercent: number;
  currency: 'EUR';
  source: 'twelve_data' | 'simulated';
  asOf: string;
};

export type HistoryPeriod = '1d' | '1m' | '1y';
export type AssetHistory = {
  points: Array<{ date: string; price: number }>;
  quote: Pick<TradingAsset, 'price' | 'changePercent' | 'currency' | 'source' | 'asOf'>;
};

export type InvestmentAccount = {
  id: string;
  name: string;
  cashBalance: number;
  totalValue: number;
  totalGainLoss: number;
};

export type TradingPosition = {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  avgPurchasePrice: number;
  marketPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
};

export type TradingOrder = {
  id: string;
  symbol: string;
  name: string;
  orderType: 'market' | 'limit' | 'stop';
  side: 'buy' | 'sell';
  quantity: number;
  price: number | null;
  status: 'pending' | 'executed' | 'cancelled' | 'failed';
  executedPrice: number | null;
  executedAt: string | null;
  createdAt: string;
};

type AccountsSummary = { investmentAccounts?: InvestmentAccount[] };

export function fetchTradingAssets() {
  return apiFetch<TradingAsset[]>('/trading/assets');
}

export function fetchAssetHistory(symbol: string, period: HistoryPeriod) {
  return apiFetch<AssetHistory>(
    `/trading/assets/${encodeURIComponent(symbol)}/history?period=${period}`,
  );
}

export function fetchManagedTradingAssets() {
  return apiFetch<TradingAsset[]>('/trading/management/assets');
}

export function updateManagedTradingAsset(id: string, isTradable: boolean) {
  return apiFetch<{ id: string; isTradable: boolean }>(
    `/trading/management/assets/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify({ isTradable }) },
  );
}

export async function fetchInvestmentAccounts() {
  const response = await apiFetch<AccountsSummary>('/accounts/all/summary');
  return response.investmentAccounts ?? [];
}

export function fetchTradingPositions(accountId: string) {
  return apiFetch<TradingPosition[]>(`/trading/positions/${encodeURIComponent(accountId)}`);
}

export function fetchTradingOrders(accountId: string) {
  return apiFetch<TradingOrder[]>(`/trading/orders/${encodeURIComponent(accountId)}`);
}

export function placeMarketOrder(input: {
  accountId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
}) {
  return apiFetch<{
    id: string;
    status: string;
    executedPrice: number;
    executedAmount: number;
    cashBalance: number;
    message: string;
  }>('/trading/orders', {
    method: 'POST',
    body: JSON.stringify({ ...input, orderType: 'market' }),
  });
}
