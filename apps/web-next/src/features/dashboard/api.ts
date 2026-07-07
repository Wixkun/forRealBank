import type { Account, DisplayTransaction } from '@/features/dashboard/types';

// Récupère les comptes bancaires + investissement, normalisés au format Account
export async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch('/api/accounts', { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to load accounts (${res.status})`);
  const data = await res.json();

  const bankAccounts: Account[] = (data.accounts || []).map((acc: Record<string, unknown>) => ({
    id: acc.id as string,
    name: acc.name as string,
    balance: acc.balance as number,
    iban: acc.iban as string | undefined,
    type: (acc.type as string) || 'checking',
    accountType: 'banking' as const,
  }));

  const investmentAccounts: Account[] = (data.investmentAccounts || []).map(
    (acc: Record<string, unknown>) => ({
      id: acc.id as string,
      name: acc.name as string,
      balance: acc.totalValue as number,
      iban: undefined,
      type: 'investment',
      accountType: 'investment' as const,
    }),
  );

  return [...bankAccounts, ...investmentAccounts];
}

// Récupère l'historique d'un compte (transactions bancaires ou activités
// d'investissement), normalisé au format DisplayTransaction
export async function fetchAccountTransactions(account: Account): Promise<DisplayTransaction[]> {
  const isInvestment = account.accountType === 'investment' || account.type === 'investment';
  const url = isInvestment
    ? `/api/trading/activities/${account.id}`
    : `/api/transactions/account/${account.id}?limit=500`;

  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to load transactions (${res.status})`);

  const data = await res.json();
  const raw: Array<Record<string, unknown>> = Array.isArray(data)
    ? data
    : (data.transactions ?? []);

  return raw.map((t) => {
    const rawAmount = t.amount as number;
    return {
      id: t.id as string,
      date: (t.date as string) || new Date().toISOString(),
      description: (t.description as string) || '',
      amount: Math.abs(rawAmount),
      type: rawAmount >= 0 ? ('credit' as const) : ('debit' as const),
      balance: t.balance != null ? (t.balance as number) : undefined,
    };
  });
}
