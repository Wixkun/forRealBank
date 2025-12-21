'use client';
import { useTheme } from '@/contexts/ThemeContext';
import { TransactionItem } from '../molecules/TransactionItem';

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
};

type TransactionsSectionProps = {
  title: string;
  transactions: Transaction[];
};

export function TransactionsSection({ title, transactions }: TransactionsSectionProps) {
  const { theme, mounted } = useTheme();

  const currentTheme = mounted ? theme : 'dark';

  return (
    <div className="mb-8">
      <h3 className={`text-xl font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <div className={`backdrop-blur-sm border rounded-2xl overflow-hidden shadow-lg ${
        currentTheme === 'dark' ? 'bg-gray-800/90 border-gray-700/50' : 'bg-white border-gray-200'
      }`}>
        {transactions.map((transaction, idx) => (
          <TransactionItem
            key={transaction.id}
            description={transaction.description}
            date={transaction.date}
            amount={transaction.amount}
            type={transaction.type}
            isLast={idx === transactions.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
