'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { AccountPageTemplate } from '@/components/templates/AccountPageTemplate';

type Transaction = {
  id: string;
  type: 'credit' | 'debit' | 'transfer' | 'payment' | 'deposit' | 'withdrawal';
  description: string;
  date: string;
  amount: string;
  balance?: string;
};

type AccountPageWrapperProps = {
  locale: string;
  accountData: {
    id: string;
    name: string;
    type: string;
    balance: string;
    accountNumber: string;
    iban: string;
    openedOn: string;
    status: string;
  };
  transactions: Transaction[];
  translations: {
    balance: string;
    accountNumber: string;
    iban: string;
    openedOn: string;
    status: string;
    allTransactions: string;
    noTransactions: string;
    quickTransfer: string;
    transferAmount: string;
    transferTo: string;
    transferDescription: string;
    transferButton: string;
    filters: {
      all: string;
      credits: string;
      debits: string;
    };
  };
};

export function AccountPageWrapper(props: AccountPageWrapperProps) {
  return (
    <ThemeProvider>
      <AccountPageTemplate {...props} />
    </ThemeProvider>
  );
}
