'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Account,
  DisplayTransaction,
  fmt,
  fmtDate,
  accountLabel,
  lastFour,
} from '@/features/dashboard/types';
import { AccountChart } from '@/features/dashboard/components/AccountChart';
import { fetchAccountTransactions } from '@/features/dashboard/api';
import { useClearNotificationsByTarget } from '@/features/notifications/useClearNotificationsByTarget';
import { useStatement } from '@/features/statements/StatementContext';
import {
  NewsDetailModal,
  NEWS_STATUS_CONFIG,
  type NewsItem,
} from '@/features/feed/components/NewsDetailModal';

// ── Period filter ─────────────────────────────────────────────────────────────

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

const PERIODS: Period[] = ['day', 'week', 'month', 'year', 'all'];

function filterByPeriod(txns: DisplayTransaction[], p: Period): DisplayTransaction[] {
  if (p === 'all') return txns;
  const cutoff = new Date();
  if (p === 'day') cutoff.setDate(cutoff.getDate() - 1);
  if (p === 'week') cutoff.setDate(cutoff.getDate() - 7);
  if (p === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
  if (p === 'year') cutoff.setFullYear(cutoff.getFullYear() - 1);
  return txns.filter((t) => new Date(t.date) >= cutoff);
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  accounts: Account[];
  selectedAccountId: string | null;
  onTransferCompleteAction?: () => void | Promise<void>;
};

export function TransactionsSection({
  accounts,
  selectedAccountId,
  onTransferCompleteAction,
}: Props) {
  const t = useTranslations('dashboard.transactions');
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>('month');
  const [showChart, setShowChart] = useState(false);

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferSourceId, setTransferSourceId] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [txDetail, setTxDetail] = useState<NewsItem | null>(null);

  // Consulter le détail d'une transaction marque lue la notification liée
  // (ex. « Virement reçu », reliée à la ligne du relevé via son group_key).
  useClearNotificationsByTarget('TRANSACTION', txDetail?.id);

  const statement = useStatement();

  const selectedAccount = selectedAccountId
    ? (accounts.find((a) => a.id === selectedAccountId) ?? null)
    : null;

  const sourceOptions = accounts.filter((a) => a.id !== selectedAccountId);
  const transferSource = transferSourceId
    ? (accounts.find((a) => a.id === transferSourceId) ?? null)
    : (sourceOptions[0] ?? null);

  const loadActivities = async (acc: Account) => {
    setLoading(true);
    try {
      setTransactions(await fetchAccountTransactions(acc));
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedAccount) return;
    setShowTransfer(false);
    setTransferError(null);
    setTransferSourceId(null);
    loadActivities(selectedAccount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId]);

  // Alimente le préremplissage de la popup « Statement » : compte sélectionné,
  // filtre de période actif et bornes des transactions chargées
  useEffect(() => {
    if (!statement) return;
    const dates = transactions.map((t) => t.date).sort();
    statement.setStatementPrefill({
      accountId: selectedAccountId,
      period,
      txRange: dates.length ? { first: dates[0], last: dates[dates.length - 1] } : null,
    });
  }, [statement, selectedAccountId, period, transactions]);

  // Ouvre la popup de détail (réutilise la modale des news de virement) en
  // synthétisant une news TRANSFER à partir de la transaction
  const openTransactionDetail = (tx: DisplayTransaction) => {
    if (!selectedAccount) return;
    const isCredit = tx.type === 'credit';
    const accName =
      selectedAccount.name || `${accountLabel(selectedAccount)} (…${lastFour(selectedAccount)})`;
    setTxDetail({
      id: tx.id,
      authorId: null,
      userId: null,
      title: tx.description || t('transactionFallback'),
      subtitle: null,
      content: tx.description || '',
      status: 'TRANSACTION',
      createdAt: tx.date,
      archivedAt: null,
      metadata: {
        kind: 'TRANSFER',
        direction: isCredit ? 'IN' : 'OUT',
        status: 'COMPLETED',
        amount: tx.amount,
        currency: 'EUR',
        fees: 0,
        transactionId: tx.id,
        executedAt: tx.date,
        sourceAccountName: isCredit ? null : accName,
        sourceIban: isCredit ? null : (selectedAccount.iban ?? null),
        destinationAccountName: isCredit ? accName : null,
        destinationIban: isCredit ? (selectedAccount.iban ?? null) : null,
        description: tx.description || null,
      },
    });
  };

  const handleTransfer = async () => {
    if (!transferSource || !selectedAccount || !transferAmount) return;
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError(t('invalidAmount'));
      return;
    }
    if (amount > transferSource.balance) {
      setTransferError(t('insufficientFunds'));
      return;
    }

    const sourceType =
      transferSource.accountType === 'investment' || transferSource.type === 'investment'
        ? 'investment'
        : 'bank';

    setTransferLoading(true);
    setTransferError(null);
    try {
      const res = await fetch('/api/transactions/transfer', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType,
          sourceAccountId: transferSource.id,
          destinationAccountId: selectedAccount.id,
          amount,
          description: `Virement ${accountLabel(transferSource)} → ${accountLabel(selectedAccount)}`,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setTransferError(data.error || t('transferFailed'));
        return;
      }

      setShowTransfer(false);
      setTransferAmount('');
      // Rafraîchissement ciblé : transactions du compte + données du dashboard
      // (soldes), sans reload complet de la page.
      await loadActivities(selectedAccount);
      await onTransferCompleteAction?.();
    } catch {
      setTransferError(t('networkError'));
    } finally {
      setTransferLoading(false);
    }
  };

  const displayed = filterByPeriod(transactions, period);

  return (
    <div className="bg-surface-1 rounded-2xl border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
        <h3 className="font-semibold text-white text-base flex items-center gap-2">
          {t('title')}
          {selectedAccount && (
            <span className="text-tertiary font-normal text-xs">
              — {accountLabel(selectedAccount)}
            </span>
          )}
        </h3>

        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-0.5">
          {PERIODS.map((key) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                period === key
                  ? 'bg-primary/15 text-tertiary border border-primary/40'
                  : 'text-fg-muted hover:text-fg-secondary'
              }`}
            >
              {t(`periods.${key}`)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {selectedAccount && (
            <button
              onClick={() => {
                setShowChart((v) => !v);
                setShowTransfer(false);
              }}
              className={`w-7 h-7 flex items-center justify-center rounded-lg border transition ${
                showChart
                  ? 'bg-primary/20 border-primary/50 text-tertiary'
                  : 'border-white/10 text-fg-muted hover:text-tertiary hover:border-primary/40'
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </button>
          )}
          {selectedAccount && sourceOptions.length > 0 && (
            <button
              onClick={() => {
                setShowTransfer((v) => !v);
                setTransferError(null);
              }}
              className="text-xs px-3 py-1 rounded-lg bg-primary/15 text-tertiary hover:bg-primary/25 border border-primary/40 transition"
            >
              {t('topUp')}
            </button>
          )}
        </div>
      </div>

      {/* Inline transfer form */}
      {showTransfer && selectedAccount && sourceOptions.length > 0 && (
        <div className="px-5 py-4 border-b border-white/5 bg-teal-950/30">
          <p className="text-tertiary text-xs mb-2 font-medium">
            {t('fromTo', { account: accountLabel(selectedAccount) })}
          </p>
          <div className="flex items-center gap-2">
            <select
              value={transferSourceId ?? sourceOptions[0]?.id ?? ''}
              onChange={(e) => setTransferSourceId(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-primary/60"
            >
              {sourceOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {accountLabel(a)} — {fmt(a.balance)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder={t('amountPlaceholder')}
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm placeholder-fg-subtle focus:outline-none focus:border-primary/60"
            />
            <button
              onClick={handleTransfer}
              disabled={transferLoading || !transferAmount}
              className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {transferLoading ? '...' : t('transfer')}
            </button>
            <button
              onClick={() => {
                setShowTransfer(false);
                setTransferError(null);
                setTransferAmount('');
              }}
              className="text-fg-muted text-xs hover:text-fg-secondary transition"
            >
              {t('cancel')}
            </button>
          </div>
          {transferError && <p className="text-red-400 text-xs mt-2">{transferError}</p>}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="px-5 py-10 text-center text-fg-muted text-sm">{t('loading')}</div>
      ) : showChart ? (
        <div className="px-5 py-4">
          <AccountChart transactions={displayed} currentBalance={selectedAccount?.balance} />
        </div>
      ) : displayed.length === 0 ? (
        <div className="px-5 py-10 text-center text-fg-muted text-sm">{t('empty')}</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-5 py-2.5 text-fg-muted text-xs font-medium">
                {t('columns.date')}
              </th>
              <th className="text-left px-5 py-2.5 text-fg-muted text-xs font-medium">
                {t('columns.description')}
              </th>
              <th className="text-left px-5 py-2.5 text-fg-muted text-xs font-medium">
                {t('columns.category')}
              </th>
              <th className="text-right px-5 py-2.5 text-fg-muted text-xs font-medium">
                {t('columns.amount')}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => openTransactionDetail(tx)}
                className="border-t border-white/4 hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <td className="px-5 py-3 text-fg-muted text-xs whitespace-nowrap">
                  {fmtDate(tx.date)}
                </td>
                <td className="px-5 py-3 text-fg-secondary text-sm">{tx.description}</td>
                <td className="px-5 py-3 text-fg-muted text-xs capitalize">{tx.type}</td>
                <td
                  className={`px-5 py-3 text-right font-mono text-sm font-semibold ${tx.type === 'credit' ? 'text-tertiary' : 'text-red-400'}`}
                >
                  {tx.type === 'credit' ? '+' : '-'}
                  {fmt(Math.abs(tx.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Détail d'une transaction : réutilise la popup des news de virement */}
      {txDetail && (
        <NewsDetailModal
          item={txDetail}
          cfg={NEWS_STATUS_CONFIG.TRANSACTION}
          onCloseAction={() => setTxDetail(null)}
        />
      )}
    </div>
  );
}
