'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { AccountPageHeader } from '@/components/organisms/AccountPageHeader';
import { AccountDetailsCard } from '@/components/molecules/AccountDetailsCard';
import { TransactionHistorySection } from '@/components/organisms/TransactionHistorySection';

type Transaction = {
  id: string;
  type: 'credit' | 'debit' | 'transfer' | 'payment' | 'deposit' | 'withdrawal';
  description: string;
  date: string;
  amount: string;
  balance?: string;
};

type AccountPageTemplateProps = {
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

export function AccountPageTemplate({
  locale,
  accountData,
  transactions,
  translations,
}: AccountPageTemplateProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        currentTheme === 'dark'
          ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-black'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}
    >
      <AccountPageHeader
        accountName={accountData.name}
        accountType={accountData.type}
        balance={accountData.balance}
        locale={locale}
        labels={{ balance: translations.balance }}
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <AccountDetailsCard
            accountName={accountData.name}
            accountNumber={accountData.accountNumber}
            iban={accountData.iban}
            openedOn={accountData.openedOn}
            status={accountData.status}
            labels={{
              accountNumber: translations.accountNumber,
              iban: translations.iban,
              openedOn: translations.openedOn,
              status: translations.status,
            }}
          />

          <TransactionHistorySection
            transactions={transactions}
            labels={{
              title: translations.allTransactions,
              noTransactions: translations.noTransactions,
              filters: translations.filters,
            }}
          />
        </div>
      </main>
    </div>
  );
}
