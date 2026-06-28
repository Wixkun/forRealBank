'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PortfolioCard } from '@/features/dashboard/components/PortfolioCard';
import { TransactionsSection } from '@/features/dashboard/components/TransactionsSection';
import NewsFeed from '@/features/feed/components/NewsFeed';
import type { Account } from '@/features/dashboard/types';

type DashboardContentProps = {
  accountData: {
    user: { firstName: string; lastName: string; email: string };
    accounts: Account[];
    recentTransactions: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
      type: 'credit' | 'debit';
    }>;
  };
  totalBalance: number;
  locale: string;
};

export function DashboardContent({ accountData, totalBalance }: DashboardContentProps) {
  const { user } = useAuth();

  const isStaff =
    (user?.roles?.includes('ADVISOR') ?? false) ||
    (user?.roles?.includes('DIRECTOR') ?? false);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAccountId !== null || accountData.accounts.length === 0) return;
    const checking =
      accountData.accounts.find(
        (a) => a.accountType === 'banking' && (a.type === 'checking' || a.type?.includes('check')),
      ) ?? accountData.accounts[0];
    if (checking) setSelectedAccountId(checking.id);
  }, [accountData.accounts, selectedAccountId]);

  return (
    <>
      {!isStaff && (
        <PortfolioCard
          accounts={accountData.accounts}
          totalBalance={totalBalance}
          selectedAccountId={selectedAccountId}
          onSelectAccount={(acc) => setSelectedAccountId(acc.id)}
        />
      )}

      {!isStaff && (
        <TransactionsSection
          accounts={accountData.accounts}
          selectedAccountId={selectedAccountId}
        />
      )}

      <div className="bg-[#111318] rounded-2xl border border-white/5 overflow-hidden">
        <NewsFeed userRoles={user?.roles ?? null} userId={user?.id ?? null} />
      </div>
    </>
  );
}
