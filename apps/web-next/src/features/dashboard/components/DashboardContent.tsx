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
  onRefreshAction?: () => void | Promise<void>;
};

export function DashboardContent({
  accountData,
  totalBalance,
  onRefreshAction,
}: DashboardContentProps) {
  const { user, isLoading: isAuthLoading } = useAuth();

  const isStaff =
    (user?.roles?.includes('ADVISOR') ?? false) ||
    (user?.roles?.includes('DIRECTOR') ?? false) ||
    (user?.roles?.includes('ADMIN') ?? false);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAccountId !== null || accountData.accounts.length === 0) return;
    const checking =
      accountData.accounts.find(
        (a) => a.accountType === 'banking' && (a.type === 'checking' || a.type?.includes('check')),
      ) ?? accountData.accounts[0];
    if (checking) setSelectedAccountId(checking.id);
  }, [accountData.accounts, selectedAccountId]);

  // On attend les rôles avant d'afficher : sinon la carte solde flashe pour
  // les rôles staff (advisor/director/admin, sans compte bancaire).
  if (isAuthLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

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
          onTransferCompleteAction={onRefreshAction}
        />
      )}

      <div className="bg-surface-1 rounded-2xl border border-edge overflow-hidden">
        <NewsFeed userRoles={user?.roles ?? null} userId={user?.id ?? null} />
      </div>
    </>
  );
}
