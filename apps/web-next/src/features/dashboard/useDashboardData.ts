import { useState, useEffect, useCallback } from 'react';

const DASHBOARD_CONFIG = {
  RECENT_TRANSACTIONS_LIMIT: 5,
} as const;

interface Account {
  id: string;
  name: string;
  balance: number;
  iban?: string;
  type: string;
  accountType?: 'banking' | 'investment';
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

      const accountsResponse = await fetch(`${apiUrl}/accounts`, {
        credentials: 'include',
        next: { revalidate: 30 },
      });

      if (!accountsResponse.ok) return;

      const accountsData = await accountsResponse.json();

      const bankAccounts = (accountsData.accounts || []).map(
        (acc: Record<string, unknown>) => ({
          id: acc.id as string,
          name: acc.name as string,
          balance: acc.balance as number,
          iban: acc.iban as string | undefined,
          type: (acc.type as string) || 'checking',
          accountType: 'banking' as const,
        }),
      );

      const investmentAccounts = (accountsData.investmentAccounts || []).map(
        (acc: Record<string, unknown>) => ({
          id: acc.id as string,
          name: acc.name as string,
          balance: acc.totalValue as number,
          iban: undefined,
          type: 'investment',
          accountType: 'investment' as const,
        }),
      );

      const newData: AccountData = {
        user: userData.user,
        accounts: [...bankAccounts, ...investmentAccounts],
        recentTransactions: [],
      };

      const transactionsResponse = await fetch(
        `${apiUrl}/transactions?limit=${DASHBOARD_CONFIG.RECENT_TRANSACTIONS_LIMIT}`,
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
