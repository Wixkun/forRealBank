import { getTranslations } from 'next-intl/server';
import { AccountPageWrapper } from '@/components/templates/AccountPageWrapper';

type PageProps = {
  params: Promise<{
    locale: string;
    accountId: string;
  }>;
};

export default async function AccountPage({ params }: PageProps) {
  const { locale, accountId } = await params;
  const t = await getTranslations({ locale, namespace: 'account' });

  const accountData = {
    id: accountId,
    name: accountId === 'checking' ? 'Main Account' : 'Savings Account',
    type: accountId === 'checking' ? 'Checking Account' : 'Savings Account',
    balance: accountId === 'checking' ? '€12,458.50' : '€45,230.00',
    accountNumber: `****${accountId === 'checking' ? '4789' : '8923'}`,
    iban: `FR76 3000 6000 0112 3456 ${accountId === 'checking' ? '7890' : '1234'} 189`,
    openedOn: accountId === 'checking' ? 'January 15, 2023' : 'March 22, 2023',
    status: t('active'),
  };

  const transactions = [
    {
      id: '1',
      type: 'credit' as const,
      description: 'Salary Deposit',
      date: '2024-12-15',
      amount: '€3,500.00',
      balance: '€12,458.50',
    },
    {
      id: '2',
      type: 'debit' as const,
      description: 'Rent Payment',
      date: '2024-12-10',
      amount: '€1,200.00',
      balance: '€8,958.50',
    },
    {
      id: '3',
      type: 'debit' as const,
      description: 'Grocery Store',
      date: '2024-12-08',
      amount: '€156.30',
      balance: '€10,158.50',
    },
    {
      id: '4',
      type: 'credit' as const,
      description: 'Freelance Payment',
      date: '2024-12-05',
      amount: '€850.00',
      balance: '€10,314.80',
    },
    {
      id: '5',
      type: 'payment' as const,
      description: 'Electric Bill',
      date: '2024-12-03',
      amount: '€85.50',
      balance: '€9,464.80',
    },
    {
      id: '6',
      type: 'debit' as const,
      description: 'Restaurant',
      date: '2024-12-01',
      amount: '€67.20',
      balance: '€9,550.30',
    },
    {
      id: '7',
      type: 'transfer' as const,
      description: 'Transfer to Savings',
      date: '2024-11-28',
      amount: '€500.00',
      balance: '€9,617.50',
    },
    {
      id: '8',
      type: 'credit' as const,
      description: 'Tax Refund',
      date: '2024-11-25',
      amount: '€420.00',
      balance: '€10,117.50',
    },
  ];

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
      transactions={transactions}
      translations={translations}
    />
  );
}
