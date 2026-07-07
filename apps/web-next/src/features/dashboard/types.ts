export type Account = {
  id: string;
  name: string;
  balance: number;
  iban?: string;
  type: string;
  accountType?: 'banking' | 'investment';
};

export type DisplayTransaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance?: number;
};

export const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const accountLabel = (acc: Account) => {
  if (acc.accountType === 'investment' || acc.type === 'investment') return 'Investment';
  const t = (acc.type ?? '').toLowerCase();
  if (t.includes('saving')) return 'Savings';
  return 'Checking';
};

export const lastFour = (acc: Account) => (acc.iban ?? acc.id).slice(-4).toUpperCase();
