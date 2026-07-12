import { useState, useEffect, useCallback } from 'react';
import type { Account } from '@/features/dashboard/types';
import { fetchAccounts } from '@/features/dashboard/api';

const DASHBOARD_CONFIG = {
  RECENT_TRANSACTIONS_LIMIT: 5,
} as const;

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

export function useDashboardData(initialData: AccountData, locale: string) {
  const [accountData, setAccountData] = useState<AccountData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = '/api';

      const userResponse = await fetch(`${apiUrl}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!userResponse.ok) return;

      const userData = await userResponse.json();

      const newData: AccountData = {
        user: userData.user,
        accounts: await fetchAccounts(),
        recentTransactions: [],
      };

      const transactionsResponse = await fetch(
        `${apiUrl}/transactions/recent?limit=${DASHBOARD_CONFIG.RECENT_TRANSACTIONS_LIMIT}`,
        { credentials: 'include', next: { revalidate: 30 } },
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
      setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, locale]);

  return { accountData, isLoading, error, refresh: loadData };
}

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
