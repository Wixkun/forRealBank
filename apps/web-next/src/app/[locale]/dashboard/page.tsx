import { getTranslations } from 'next-intl/server';
import { DashboardWrapper } from '@/components/templates/DashboardWrapper';

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  const accountData = {
    user: {
      firstName: 'Alexis',
      lastName: 'Montoya',
      email: 'alexis@example.com',
    },
    accounts: [
      {
        id: '1',
        name: t('accountTypes.checking'),
        balance: 5420.50,
        iban: 'FR76 1234 5678 9012 3456 7890 123',
        type: 'checking' as const,
        accountType: 'banking' as const,
      },
      {
        id: '2',
        name: t('accountTypes.savings'),
        balance: 12350.00,
        iban: 'FR76 9876 5432 1098 7654 3210 987',
        type: 'savings' as const,
        accountType: 'banking' as const,
      },
      {
        id: 'trading',
        name: 'Trading Account',
        balance: 78450.25,
        iban: 'FR76 5555 6666 7777 8888 9999 000',
        type: 'checking' as const,
        accountType: 'brokerage' as const,
      },
    ],
    recentTransactions: [
      { id: '1', date: '20 Déc', description: 'Salaire', amount: 3500, type: 'credit' as const },
      { id: '2', date: '18 Déc', description: 'Carrefour', amount: -85.40, type: 'debit' as const },
      { id: '3', date: '15 Déc', description: 'Netflix', amount: -13.99, type: 'debit' as const },
      { id: '4', date: '12 Déc', description: 'Virement Épargne', amount: -500, type: 'debit' as const },
      { id: '5', date: '10 Déc', description: 'Remboursement', amount: 45.20, type: 'credit' as const },
    ],
  };

  const totalBalance = accountData.accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const translations = {
    greeting: t('greeting'),
    totalBalance: t('totalBalance'),
    monthlyGrowth: t('monthlyGrowth'),
    accounts: t('accounts'),
    recentTransactions: t('recentTransactions'),
    quickActions: {
      send: t('quickActions.send'),
      receive: t('quickActions.receive'),
      stats: t('quickActions.stats'),
      more: t('quickActions.more'),
    },
    accountTypes: {
      checking: t('accountTypes.checking'),
      savings: t('accountTypes.savings'),
    },
  };

  return (
    <DashboardWrapper
      translations={translations}
      accountData={accountData}
      totalBalance={totalBalance}
      locale={locale}
    />
  );
}
