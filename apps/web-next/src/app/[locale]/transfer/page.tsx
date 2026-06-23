'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { TransferFormCard } from '@/components/molecules/TransferFormCard';
import { DashboardHeader } from '@/components/organisms/DashboardHeader';

type AccountItem = {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'brokerage';
};

type AccountsResponse = {
  bankAccounts: Array<{
    id: string;
    name: string;
    balance: number;
    iban: string;
    type: 'checking' | 'savings';
    accountType: 'banking';
  }>;
  brokerageAccounts: Array<{
    id: string;
    name: string;
    balance: number;
    iban: string;
    type: 'checking';
    accountType: 'brokerage';
  }>;
};

type AccountItemWithIban = AccountItem & { iban?: string };

function TransferPageContent() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('dashboard');
  const tAccount = useTranslations('account');
  const common = useTranslations('common');
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  const [accounts, setAccounts] = useState<AccountItemWithIban[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [destinationIban, setDestinationIban] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/accounts`);
        const data: AccountsResponse = await res.json();
        const bank: AccountItemWithIban[] = (data.bankAccounts || []).map((acc) => ({
          id: acc.id,
          name: acc.name,
          balance: Number(acc.balance),
          type: acc.type,
          iban: acc.iban,
        }));
        const broker: AccountItemWithIban[] = (data.brokerageAccounts || []).map((acc) => ({
          id: acc.id,
          name: acc.name,
          balance: Number(acc.balance),
          type: 'brokerage',
          iban: acc.iban,
        }));
        const list: AccountItemWithIban[] = [...bank, ...broker];
        setAccounts(list);
        const defaultSrc = list.find((a) => a.type === 'checking') || list[0];
        if (defaultSrc) setSourceAccountId(defaultSrc.id);
      } catch {
        setStatus(common('errorLoadingAccount'));
      }
    };
    load();
  }, [common]);

  type TransferPayload = {
    sourceType: 'bank' | 'brokerage';
    sourceAccountId: string;
    destinationAccountId?: string;
    destinationIban?: string;
    amount: number;
    description?: string;
  };

  const handleSubmit = async (data: {
    amount: string;
    recipient?: string;
    description?: string;
  }) => {
    if (!sourceAccountId) {
      setError(common('error'));
      setSuccess('');
      return;
    }
    setError('');
    setSuccess('');
    setStatus('');
    try {
      const amount = Number(data.amount);
      const body: TransferPayload = {
        sourceType:
          accounts.find((a) => a.id === sourceAccountId)?.type === 'brokerage'
            ? 'brokerage'
            : 'bank',
        sourceAccountId,
        amount,
        description: data.description || 'Transfer',
      };
      if (destinationAccountId && destinationAccountId !== 'external') {
        body.destinationAccountId = destinationAccountId;
      } else {
        body.destinationIban = destinationIban || data.recipient || '';
      }
      const res = await fetch('/api/transactions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Transfer failed');
        setSuccess('');
      } else {
        setSuccess('Transfer completed successfully');
        setError('');
        setStatus('');
      }
    } catch {
      setError('Transfer failed');
      setSuccess('');
    }
  };

  const getValidDestinations = () => {
    const source = accounts.find((a) => a.id === sourceAccountId);
    if (!source) return [];

    return accounts.filter((acc) => {
      if (acc.id === sourceAccountId) return false;
      return !(source.type === 'savings' && acc.type === 'savings');
    });
  };

  const validDestinations = getValidDestinations();

  return (
    <div
      className={`min-h-screen transition-colors ${
        currentTheme === 'dark'
          ? 'bg-linear-to-br from-gray-900 via-gray-800 to-slate-900'
          : 'bg-linear-to-br from-gray-50 via-white to-gray-100'
      }`}
    >
      <DashboardHeader />
      <div className="max-w-3xl mx-auto px-6 py-10 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h1
            className={`text-2xl font-semibold ${
              currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {t('quickActions.send')}
          </h1>
        </div>

        {error && (
          <div
            className={`px-4 py-3 rounded-lg mb-6 ${
              currentTheme === 'dark'
                ? 'bg-red-500/20 border border-red-500/50 text-red-200'
                : 'bg-red-100 border border-red-300 text-red-800'
            }`}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className={`px-4 py-3 rounded-lg mb-6 ${
              currentTheme === 'dark'
                ? 'bg-green-500/20 border border-green-500/50 text-green-200'
                : 'bg-green-100 border border-green-300 text-green-800'
            }`}
          >
            {success}
          </div>
        )}

        <div
          className={`rounded-2xl p-6 mb-6 ${
            currentTheme === 'dark'
              ? 'bg-gray-800/60 border border-gray-700'
              : 'bg-white border border-gray-300'
          }`}
        >
          <label
            className={`block text-sm mb-2 ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Source account
          </label>
          <select
            className={`w-full p-3 rounded-md border transition-colors ${
              currentTheme === 'dark'
                ? 'bg-gray-900 text-white border-gray-700'
                : 'bg-white text-gray-900 border-gray-300'
            }`}
            value={sourceAccountId}
            onChange={(e) => setSourceAccountId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} • {a.type} •{' '}
                {new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(
                  a.balance,
                )}
              </option>
            ))}
          </select>
        </div>

        <div
          className={`rounded-2xl p-6 mb-6 ${
            currentTheme === 'dark'
              ? 'bg-gray-800/60 border border-gray-700'
              : 'bg-white border border-gray-300'
          }`}
        >
          <label
            className={`block text-sm mb-2 ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Or select one of your accounts
          </label>
          <select
            className={`w-full p-3 rounded-md border transition-colors ${
              currentTheme === 'dark'
                ? 'bg-gray-900 text-white border-gray-700'
                : 'bg-white text-gray-900 border-gray-300'
            }`}
            value={destinationAccountId}
            onChange={(e) => {
              const val = e.target.value;
              setDestinationAccountId(val);
              if (val && val !== 'external') {
                const acc = accounts.find((a) => a.id === val);
                setDestinationIban(acc?.iban || '');
              } else {
                setDestinationIban('');
              }
            }}
          >
            <option value="external">Externe</option>
            {validDestinations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} • {a.type}
              </option>
            ))}
          </select>
        </div>

        <div
          className={`rounded-2xl p-6 mb-6 ${
            currentTheme === 'dark'
              ? 'bg-gray-800/60 border border-gray-700'
              : 'bg-white border border-gray-300'
          }`}
        >
          <label
            className={`block text-sm mb-2 ${
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            IBAN
          </label>
          <input
            type="text"
            className={`w-full p-3 rounded-md border transition-colors ${
              currentTheme === 'dark'
                ? 'bg-gray-900 text-white border-gray-700'
                : 'bg-white text-gray-900 border-gray-300'
            }`}
            value={destinationIban}
            onChange={(e) => setDestinationIban(e.target.value)}
            readOnly={destinationAccountId !== 'external' && destinationAccountId !== ''}
            placeholder={
              destinationAccountId === 'external' || !destinationAccountId
                ? 'FR76 XXXX XXXX XXXX XXXX XXXX XXX'
                : ''
            }
          />
        </div>

        <TransferFormCard
          onSubmit={handleSubmit}
          hideRecipient={true}
          labels={{
            title: tAccount('quickTransfer'),
            amount: tAccount('transferAmount'),
            recipient: tAccount('transferTo'),
            description: tAccount('transferDescription'),
            submit: tAccount('transferButton'),
          }}
        />

        {status && <div className="mt-4 text-sm text-gray-200">{status}</div>}
      </div>
    </div>
  );
}

export default function TransferPage() {
  return (
    <ThemeProvider>
      <TransferPageContent />{' '}
    </ThemeProvider>
  );
}

