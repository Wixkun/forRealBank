'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardWrapper } from '@/components/templates/DashboardWrapper';
import { useDashboardData } from '@/hooks/useDashboardData';

export interface Account {
  id: string;
  name: string;
  balance: number;
  iban?: string;
  type: string;
  accountType?: 'banking' | 'brokerage';
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

const INITIAL_ACCOUNT_DATA = {
  user: {
    firstName: 'Loading...',
    lastName: '',
    email: 'user@example.com',
  },
  accounts: [],
  recentTransactions: [],
};

export default function DashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('dashboard');

  const { accountData } = useDashboardData(INITIAL_ACCOUNT_DATA, locale);

  const translations = {
    greeting: t('greeting'),
    totalBalance: t('totalBalance'),
    accounts: t('accounts'),
    recentTransactions: t('recentTransactions'),
    quickActions: {
      send: t('quickActions.send'),
      receive: t('quickActions.receive'),
      chat: t('quickActions.chat'),
      more: t('quickActions.more'),
    },
    accountTypes: {
      checking: t('accountTypes.checking'),
      savings: t('accountTypes.savings'),
    },
  };

  const totalBalance = accountData.accounts.reduce(
    (sum, acc) => sum + (acc.balance || 0),
    0
  );

  return (
    <DashboardWrapper
      translations={translations}
      accountData={accountData}
      totalBalance={totalBalance}
      locale={locale}
    />
  );
}
