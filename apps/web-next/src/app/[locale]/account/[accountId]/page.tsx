import { getTranslations } from 'next-intl/server';
import { AccountPageWrapper } from '@/components/templates/AccountPageWrapper';
import { getBankAccount, getAccountTransactions } from '@/lib/server-api';

type BankAccount = {
  id: string;
  name: string;
  accountType: 'checking' | 'savings';
  balance: number;
  accountNumber?: string;
  iban: string;
  openedAt: string;
  status: string;
};

type ApiTransaction = {
  id: string;
  type: 'credit' | 'debit' | 'transfer' | 'payment' | 'deposit' | 'withdrawal';
  description: string;
  date: string;
  amount: number;
  balance?: number;
};

type PageProps = {
  params: Promise<{
    locale: string;
    accountId: string;
  }>;
};

export default async function AccountPage({ params }: PageProps) {
  const { locale, accountId } = await params;
  const t = await getTranslations({ locale, namespace: 'account' });
  const dashboardTranslations = await getTranslations({ locale, namespace: 'dashboard' });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);

  let account: BankAccount | null = null;
  let transactions: ApiTransaction[] = [];

  try {
    account = await getBankAccount(accountId);
    transactions = await getAccountTransactions(accountId, 50);
  } catch (error) {
    console.error('[Account Page] Error loading account:', error);
    account = null;
  }



  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-800">
        <div className="text-white text-lg">Chargement du compte...</div>
      </div>
    );
  }

  const accountTypeLabel = account.accountType === 'savings'
    ? dashboardTranslations('accountTypes.savings')
    : dashboardTranslations('accountTypes.checking');

  const accountData = {
    id: account.id,
    name: account.name,
    type: accountTypeLabel,
    balance: formatCurrency(account.balance),
    accountNumber: account.accountNumber || account.id,
    iban: account.iban,
    openedOn: new Date(account.openedAt).toLocaleDateString(locale),
    status: account.status === 'active' ? t('active') : account.status,
  };

  const formattedTransactions = transactions.map((txn: ApiTransaction) => ({
    id: txn.id,
    type: txn.type,
    description: txn.description,
    date: new Date(txn.date).toLocaleDateString(locale),
    amount: formatCurrency(txn.amount),
    balance: txn.balance !== undefined ? formatCurrency(txn.balance) : undefined,
  }));

  const translations = {
    balance: t('balance'),
    accountNumber: t('accountNumber'),
    iban: t('iban'),
    openedOn: t('openedOn'),
    status: t('status'),
    allTransactions: t('allTransactions'),
    noTransactions: t('noTransactions'),
    quickTransfer: t('quickTransfer'),
    transferAmount: t('transferAmount'),
    transferTo: t('transferTo'),
    transferDescription: t('transferDescription'),
    transferButton: t('transferButton'),
    filters: {
      all: t('filters.all'),
      credits: t('filters.credits'),
      debits: t('filters.debits'),
    },
  };

  return (
    <AccountPageWrapper
      locale={locale}
      accountData={accountData}
      transactions={formattedTransactions}
      translations={translations}
    />
  );
}
