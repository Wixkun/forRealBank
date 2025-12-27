const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Extended fetch options interface
 * Includes all standard RequestInit options plus optional cache configuration
 * @interface FetchOptions
 */
interface FetchOptions extends Omit<RequestInit, 'cache'> {
  cache?: RequestCache;
}

/**
 * Generic API call function
 * Centralized request handler for all unauthenticated API calls
 * @template T - The expected response type
 * @param endpoint - The API endpoint path (relative to API_URL)
 * @param options - Optional fetch configuration
 * @param errorMessage - Custom error message for failed requests
 * @returns Promise containing the parsed JSON response
 * @throws Error if the request fails
 */
async function apiCall<T>(
  endpoint: string,
  options: FetchOptions = {},
  errorMessage: string = 'API request failed'
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

/**
 * Authenticated API call function
 * Adds authorization header for token-based requests
 * @template T - The expected response type
 * @param endpoint - The API endpoint path
 * @param token - The authorization token (JWT)
 * @param method - HTTP method (default: GET)
 * @param body - Optional request body for POST/PUT operations
 * @param errorMessage - Custom error message for failed requests
 * @returns Promise containing the parsed JSON response
 * @throws Error if the request fails
 */
async function apiCallWithAuth<T>(
  endpoint: string,
  token: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown,
  errorMessage: string = 'API request failed'
): Promise<T> {
  const options: FetchOptions = {
    method,
    headers: { 'Authorization': `Bearer ${token}` },
  };

  if (body) {
    options.body = JSON.stringify(body);
    (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  return apiCall<T>(endpoint, options, errorMessage);
}

/**
 * Fetch market assets
 * @param type - Optional asset type filter
 * @returns Promise containing market assets
 */
export async function fetchMarketAssets(type?: string) {
  const endpoint = `/market/assets${type && type !== 'all' ? `?type=${type}` : ''}`;
  return apiCall<Array<{
    symbol: string;
    name: string;
    assetType: 'stock' | 'crypto' | 'etf' | 'commodity';
    initialPrice: string;
  }>>(endpoint, {}, 'Failed to fetch market assets');
}

/**
 * Fetch user accounts data
 * @param token - Authorization token
 * @returns Promise containing accounts information
 */
export async function fetchAccountsData(token: string) {
  return apiCallWithAuth<unknown>('/accounts', token, 'GET', undefined, 'Failed to fetch accounts');
}

/**
 * Fetch recent transactions for authenticated user
 * @param token - Authorization token
 * @param limit - Maximum number of transactions to return
 * @returns Promise containing recent transactions
 */
export async function fetchRecentTransactions(token: string, limit: number = 5) {
  return apiCallWithAuth<unknown>(
    `/transactions/recent?limit=${limit}`,
    token,
    'GET',
    undefined,
    'Failed to fetch transactions'
  );
}

/**
 * Fetch transactions for a specific account
 * @param accountId - The account identifier
 * @param token - Authorization token
 * @param limit - Maximum number of transactions to return
 * @param type - Optional transaction type filter
 * @returns Promise containing account transactions
 */
export async function fetchAccountTransactions(
  accountId: string,
  token: string,
  limit: number = 50,
  type?: string
) {
  const endpoint = `/transactions/account/${accountId}?limit=${limit}${type && type !== 'all' ? `&type=${type}` : ''}`;
  return apiCallWithAuth<unknown>(endpoint, token, 'GET', undefined, 'Failed to fetch account transactions');
}

/**
 * Fetch trading positions for an account
 * @param accountId - The account identifier
 * @param token - Authorization token
 * @returns Promise containing trading positions
 */
export async function fetchTradingPositions(accountId: string, token: string) {
  return apiCallWithAuth<unknown>(
    `/trading/positions/${accountId}`,
    token,
    'GET',
    undefined,
    'Failed to fetch trading positions'
  );
}

/**
 * Fetch bank account details
 * @param accountId - The bank account identifier
 * @param token - Authorization token
 * @returns Promise containing bank account information
 */
export async function fetchBankAccount(accountId: string, token: string) {
  return apiCallWithAuth<unknown>(
    `/accounts/bank/${accountId}`,
    token,
    'GET',
    undefined,
    'Failed to fetch bank account'
  );
}

/**
 * Fetch brokerage account details
 * @param accountId - The brokerage account identifier
 * @param token - Authorization token
 * @returns Promise containing brokerage account information
 */
export async function fetchBrokerageAccount(accountId: string, token: string) {
  return apiCallWithAuth<unknown>(
    `/accounts/brokerage/${accountId}`,
    token,
    'GET',
    undefined,
    'Failed to fetch brokerage account'
  );
}

/**
 * Fetch trading positions for a client account
 * @param accountId - The account identifier
 * @returns Promise containing trading positions
 */
export async function fetchTradingPositionsClient(accountId: string) {
  return apiCall<Array<{
    id: string;
    symbol: string;
    name: string;
    assetType: 'stock' | 'crypto' | 'etf' | 'commodity';
    quantity: number;
    avgPurchasePrice: number;
  }>>(
    `/trading/positions/${accountId}`,
    { credentials: 'include' },
    'Failed to fetch trading positions'
  );
}

/**
 * Place a new trading order
 * @param body - Order details including account, symbol, side, quantity, type, and optional price
 * @returns Promise containing the created order information
 */
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
    'Failed to place order'
  );
}
