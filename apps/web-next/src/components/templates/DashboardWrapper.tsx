'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { DashboardContent } from '@/components/templates/DashboardContent';

type DashboardWrapperProps = {
  translations: {
    greeting: string;
    totalBalance: string;
    accounts: string;
    recentTransactions: string;
    quickActions: {
      send: string;
      receive: string;
      chat: string;
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

export function DashboardWrapper(props: DashboardWrapperProps) {
  return (
    <ThemeProvider>
      <DashboardContent {...props} />
    </ThemeProvider>
  );
}
