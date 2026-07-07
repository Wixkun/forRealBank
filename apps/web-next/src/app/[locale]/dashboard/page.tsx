'use client';

import { useParams } from 'next/navigation';
import { DashboardContent } from '@/features/dashboard/components/DashboardContent';
import { useDashboardData } from '@/features/dashboard/useDashboardData';

const INITIAL_ACCOUNT_DATA = {
  user: { firstName: 'Loading...', lastName: '', email: '' },
  accounts: [],
  recentTransactions: [],
};

export default function DashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { accountData, refresh } = useDashboardData(INITIAL_ACCOUNT_DATA, locale);
  const totalBalance = accountData.accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <DashboardContent
      accountData={accountData}
      totalBalance={totalBalance}
      locale={locale}
      onRefreshAction={refresh}
    />
  );
}
