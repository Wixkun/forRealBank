'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { DashboardHeader } from '@/components/organisms/DashboardHeader';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { AccountsSection } from '@/components/organisms/AccountsSection';
import { TransactionsSection } from '@/components/organisms/TransactionsSection';
import { QuickActionsSection } from '@/components/organisms/QuickActionsSection';

type DashboardContentProps = {
  translations: {
    greeting: string;
    totalBalance: string;
    monthlyGrowth: string;
    accounts: string;
    recentTransactions: string;
    quickActions: {
      send: string;
      receive: string;
      chat: string;
      stats: string;
      more: string;
    };
    accountTypes: {
      checking: string;
      savings: string;
    };
  };
  accountData: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    accounts: Array<{
      id: string;
      name: string;
      balance: number;
      iban?: string;
      type: string;
      accountType?: 'banking' | 'brokerage';
    }>;
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

export function DashboardContent({ translations, accountData, totalBalance, locale }: DashboardContentProps) {
  const { theme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  const quickActions = [
    { icon: '↗', label: translations.quickActions.send, variant: 'teal' as const },
    { icon: '↓', label: translations.quickActions.receive, variant: 'teal' as const },
    { icon: '💬', label: translations.quickActions.chat, variant: 'cyan' as const, href: `/${locale}/chat` },
    { icon: '�📊', label: translations.quickActions.stats, variant: 'cyan' as const },
    { icon: '⚙️', label: translations.quickActions.more, variant: 'gray' as const },
  ];

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50'
    }`}>
      <DashboardHeader userName={accountData.user.firstName} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className={`text-base mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {translations.greeting}
          </p>
          <h2 className={`text-3xl font-semibold ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'
              : 'text-gray-900'
          }`}>
            {accountData.user.firstName}
          </h2>
        </div>

        <BalanceCard
          label={translations.totalBalance}
          amount={totalBalance}
          growthText={translations.monthlyGrowth}
        />

        <AccountsSection
          title={translations.accounts}
          accounts={accountData.accounts}
          locale={locale}
        />

        <TransactionsSection
          title={translations.recentTransactions}
          transactions={accountData.recentTransactions}
        />

        <QuickActionsSection actions={quickActions} />
      </main>
    </div>
  );
}
