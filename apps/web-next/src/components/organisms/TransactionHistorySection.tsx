'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { TransactionListItem } from '@/components/molecules/TransactionListItem';

type Transaction = {
  id: string;
  type: 'credit' | 'debit' | 'transfer' | 'payment' | 'deposit' | 'withdrawal';
  description: string;
  date: string;
  amount: string;
  balance?: string;
};

type TransactionHistorySectionProps = {
  transactions: Transaction[];
  labels: {
    title: string;
    noTransactions: string;
    filters: {
      all: string;
      credits: string;
      debits: string;
    };
  };
};

export function TransactionHistorySection({
  transactions,
  labels,
}: TransactionHistorySectionProps) {
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';
  const [filter, setFilter] = useState<'all' | 'credits' | 'debits'>('all');

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'credits')
      return t.type === 'credit' || t.type === 'deposit';
    if (filter === 'debits')
      return t.type === 'debit' || t.type === 'withdrawal' || t.type === 'payment';
    return true;
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2
          className={`text-2xl font-bold ${
            currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          {labels.title}
        </h2>

        <div className="flex gap-2">
          {(['all', 'credits', 'debits'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === filterType
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white'
                  : currentTheme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {labels.filters[filterType]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div
            className={`text-center py-12 rounded-2xl border ${
              currentTheme === 'dark'
                ? 'bg-gray-900/30 border-gray-800 text-gray-400'
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
          >
            {labels.noTransactions}
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <TransactionListItem key={transaction.id} {...transaction} />
          ))
        )}
      </div>
    </section>
  );
}
