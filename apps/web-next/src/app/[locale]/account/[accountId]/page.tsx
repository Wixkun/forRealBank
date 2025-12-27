'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AccountPageWrapper } from '@/components/templates/AccountPageWrapper';
import { useEffect, useState } from 'react';

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

export default function AccountPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const accountId = params?.accountId as string;
  const t = useTranslations('account');
    const tCommon = useTranslations('common');
  const dashboardT = useTranslations('dashboard');

  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const accountRes = await fetch(`/api/proxy/accounts/bank/${accountId}`);
        if (!accountRes.ok) {
          throw new Error(`Failed to fetch account: ${accountRes.status}`);
        }
        const accountData = await accountRes.json();
        setAccount(accountData);

        const txnRes = await fetch(`/api/proxy/transactions/account/${accountId}?limit=50`);
        if (txnRes.ok) {
          const txnData = await txnRes.json();
          setTransactions(txnData);
        }
      } catch (err) {
        console.error('[Account Page] Error loading account:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchData();
    }
  }, [accountId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-800">
        <div className="text-white text-lg">{tCommon('loadingAccount')}</div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-800">
        <div className="text-white">
          <div className="text-lg mb-2">{tCommon('errorLoadingAccount')}</div>
          <div className="text-sm text-gray-300">ID: {accountId}</div>
          {error && <div className="text-sm text-red-300 mt-2">{error}</div>}
        </div>
      </div>
    );
  }

  const accountTypeLabel = account.accountType === 'savings'
    ? dashboardT('accountTypes.savings')
    : dashboardT('accountTypes.checking');

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
    amount: txn.amount, 
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
