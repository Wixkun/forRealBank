'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Account } from '@/features/dashboard/types';
import { fetchAccounts } from '@/features/dashboard/api';

export default function DashboardTransferPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const tAccount = useTranslations('account');
  const common = useTranslations('common');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [destinationIban, setDestinationIban] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchAccounts();
        setAccounts(list);
        const defaultSrc = list.find((a) => a.type === 'checking') || list[0];
        if (defaultSrc) setSourceAccountId(defaultSrc.id);
      } catch {
        setError(common('errorLoadingAccount'));
      }
    };
    load();
  }, [common]);

  const validDestinations = accounts.filter((acc) => {
    if (acc.id === sourceAccountId) return false;
    const source = accounts.find((a) => a.id === sourceAccountId);
    return !(source?.type === 'savings' && acc.type === 'savings');
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceAccountId) {
      setError(common('error'));
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        sourceType:
          accounts.find((a) => a.id === sourceAccountId)?.accountType === 'investment'
            ? 'investment'
            : 'bank',
        sourceAccountId,
        amount: Number(amount),
        description: description || 'Transfer',
      };
      if (destinationAccountId && destinationAccountId !== 'external') {
        body.destinationAccountId = destinationAccountId;
      } else {
        body.destinationIban = destinationIban;
      }

      const res = await fetch('/api/transactions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || tAccount('transferFailed'));
      } else {
        setSuccess(tAccount('transferSuccess'));
        setAmount('');
        setDescription('');
      }
    } catch {
      setError(tAccount('transferFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-fg mb-6">{tAccount('quickTransfer')}</h1>

      {error && (
        <div className="px-4 py-3 rounded-lg mb-4 bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-lg mb-4 bg-green-500/20 border border-green-500/50 text-green-200 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface-1 rounded-2xl p-5 border border-edge">
          <label className="block text-xs text-fg-muted mb-2">{tAccount('sourceAccount')}</label>
          <select
            className="w-full p-3 rounded-lg bg-input text-fg border border-edge-strong text-sm focus:outline-none focus:border-primary/60"
            value={sourceAccountId}
            onChange={(e) => setSourceAccountId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.type} · {fmt(a.balance)}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-surface-1 rounded-2xl p-5 border border-edge">
          <label className="block text-xs text-fg-muted mb-2">{tAccount('destination')}</label>
          <select
            className="w-full p-3 rounded-lg bg-input text-fg border border-edge-strong text-sm focus:outline-none focus:border-primary/60"
            value={destinationAccountId}
            onChange={(e) => {
              const val = e.target.value;
              setDestinationAccountId(val);
              if (val && val !== 'external') {
                setDestinationIban(accounts.find((a) => a.id === val)?.iban || '');
              } else {
                setDestinationIban('');
              }
            }}
          >
            <option value="external">{tAccount('externalIban')}</option>
            {validDestinations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.type}
              </option>
            ))}
          </select>

          {(destinationAccountId === 'external' || !destinationAccountId) && (
            <input
              type="text"
              className="w-full mt-3 p-3 rounded-lg bg-input text-fg border border-edge-strong text-sm focus:outline-none focus:border-primary/60"
              value={destinationIban}
              onChange={(e) => setDestinationIban(e.target.value)}
              placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
            />
          )}
        </div>

        <div className="bg-surface-1 rounded-2xl p-5 border border-edge space-y-4">
          <div>
            <label className="block text-xs text-fg-muted mb-2">{tAccount('transferAmount')}</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              className="w-full p-3 rounded-lg bg-input text-fg border border-edge-strong text-sm focus:outline-none focus:border-primary/60"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs text-fg-muted mb-2">
              {tAccount('transferDescription')}
            </label>
            <input
              type="text"
              className="w-full p-3 rounded-lg bg-input text-fg border border-edge-strong text-sm focus:outline-none focus:border-primary/60"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tAccount('transferDescription')}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !amount}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? tAccount('processing') : tAccount('transferButton')}
        </button>
      </form>
    </div>
  );
}
