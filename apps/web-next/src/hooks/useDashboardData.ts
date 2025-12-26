import { useState, useEffect } from 'react';

const DASHBOARD_CONFIG = {
  RECENT_TRANSACTIONS_LIMIT: 5,
} as const;

interface Account {
  id: string;
  name: string;
  balance: number;
  iban?: string;
  type: string;
  accountType?: 'banking' | 'brokerage';
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
}

interface AccountData {
  user: { firstName: string; lastName: string; email: string };
  accounts: Account[];
  recentTransactions: Transaction[];
}

/**
 * Custom hook for loading dashboard data
 * Fetches user info, accounts, and recent transactions
 * @param initialData - Initial server-side data
 * @param locale - Current locale for cache key
 * @returns Account data including user info, accounts, and transactions
 */
export function useDashboardData(initialData: AccountData, locale: string) {
  const [accountData, setAccountData] = useState<AccountData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

        const userResponse = await fetch(`${apiUrl}/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!userResponse.ok) {
          console.error('[useDashboardData] Failed to fetch user info:', userResponse.status);
          return;
        }

        const userData = await userResponse.json();

        const accountsResponse = await fetch(`${apiUrl}/accounts`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!accountsResponse.ok) {
          console.error('[useDashboardData] Failed to fetch accounts:', accountsResponse.status);
          return;
        }

        const accountsData = await accountsResponse.json();
        const allAccounts = [
          ...(accountsData.bankAccounts || []),
          ...(accountsData.brokerageAccounts || []),
        ];

        const newData: AccountData = {
          user: userData.user,
          accounts: normalizeAccounts(allAccounts),
          recentTransactions: [],
        };

        const transactionsResponse = await fetch(
          `${apiUrl}/transactions/recent?limit=${DASHBOARD_CONFIG.RECENT_TRANSACTIONS_LIMIT}`,
          {
            credentials: 'include',
            cache: 'no-store',
          }
        );

        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          const transactions = Array.isArray(transactionsData)
            ? transactionsData
            : transactionsData.transactions || [];

          newData.recentTransactions = normalizeTransactions(transactions);
        }

        setAccountData(newData);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load dashboard data');
        console.error('[useDashboardData] Error loading data:', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [locale]);

  return { accountData, isLoading, error };
}

/**
 * Normalize account data to consistent format
 * @param accounts - Raw account data from API
 * @returns Normalized account array
 */
function normalizeAccounts(accounts: Array<Record<string, unknown>>): Account[] {
  return accounts.map((acc) => ({
    id: acc.id as string,
    name: acc.name as string,
    balance: acc.balance as number,
    iban: acc.iban as string | undefined,
    type: (acc.type as string) || 'checking',
    accountType: acc.accountType as 'banking' | 'brokerage' | undefined,
  }));
}

/**
 * Normalize transaction data to consistent format
 * @param transactions - Raw transaction data from API
 * @returns Normalized transaction array
 */
function normalizeTransactions(transactions: Array<Record<string, unknown>>): Transaction[] {
  return transactions.map((t) => {
    const amount = t.amount as number;
    return {
      id: t.id as string,
      date: (t.date as string) || new Date().toISOString(),
      description: (t.description as string) || `${t.type} - ${amount}`,
      amount: Math.abs(amount),
      type: amount < 0 ? ('debit' as const) : ('credit' as const),
    };
  });
}
