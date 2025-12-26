'use client';
import { useTheme } from '@/contexts/ThemeContext';
import { AccountCard } from '../molecules/AccountCard';

type Account = {
  id: string;
  name: string;
  balance: number;
  iban?: string | undefined;
  type: string;
  accountType?: 'banking' | 'brokerage';
};

type AccountsSectionProps = {
  title: string;
  accounts: Account[];
  locale: string;
};

export function AccountsSection({ title, accounts, locale }: AccountsSectionProps) {
  const { theme, mounted } = useTheme();

  const currentTheme = mounted ? theme : 'dark';

  return (
    <div className="mb-8">
      <h3 className={`text-xl font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <div className="space-y-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            id={account.id}
            name={account.name}
            balance={account.balance}
            iban={account.iban as string | undefined}
            type={account.type}
            accountType={account.accountType}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}
