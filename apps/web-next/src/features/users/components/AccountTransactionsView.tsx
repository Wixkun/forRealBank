'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { fetchManagedTransactions } from '@/features/users/api';
import type { ManagedAccount, ManagedTransaction } from '@/features/users/types';
import { generateStatementPdf } from '@/features/statements/generateStatementPdf';
import { generateTransactionDetailPdf } from '@/features/users/generateTransactionDetailPdf';

const inputClass =
  'w-full bg-input border border-edge-strong rounded-lg px-3 py-2 text-fg text-sm focus:outline-none focus:border-primary/60 [color-scheme:dark]';

/**
 * Transactions d'un compte client (lecture seule) : filtre par date / période
 * (appliqué CÔTÉ SERVEUR), détail par transaction, relevé PDF de la période et
 * détail PDF d'une transaction — via les générateurs PDF existants. Pour un
 * compte Investment, seuls les mouvements monétaires sont servis par l'API.
 */
export function AccountTransactionsView({
  ownerName,
  account,
}: {
  ownerName: string;
  account: ManagedAccount;
}) {
  const t = useTranslations('users.transactions');
  const tPdf = useTranslations('statements.pdf');
  const tTxPdf = useTranslations('users.transactionPdf');
  const tTypes = useTranslations('users.accounts.types');
  const locale = useLocale();
  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [items, setItems] = useState<ManagedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const kind = account.kind;
  const accountLabel = tTypes(account.type);
  const maskedNumber =
    account.kind === 'bank' ? `${accountLabel} (…${account.iban.slice(-4)})` : account.name;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      setItems(
        await fetchManagedTransactions(kind, account.id, {
          from: from || undefined,
          to: to || undefined,
        }),
      );
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [kind, account.id, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const money = (n: number) =>
    Math.abs(n).toLocaleString(dateLocale, { style: 'currency', currency: account.currency });
  const rangeValid = !from || !to || from <= to;

  // Relevé PDF de la période : même générateur que les relevés client. Pour
  // Investment, l'API ne renvoie déjà que les mouvements monétaires.
  const downloadStatement = async () => {
    setIsGenerating(true);
    setPdfError(false);
    try {
      const sorted = [...items].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const periodStart = from ? new Date(`${from}T00:00:00`) : new Date(first?.date ?? Date.now());
      const periodEnd = to ? new Date(`${to}T00:00:00`) : new Date(last?.date ?? Date.now());
      await generateStatementPdf({
        clientName: ownerName,
        accountLabel,
        accountName: account.name,
        maskedNumber,
        iban: account.kind === 'bank' ? account.iban : null,
        currency: account.currency,
        currentBalance: account.kind === 'bank' ? account.balance : account.cashBalance,
        periodStart,
        periodEnd,
        transactions: sorted.map((tx) => ({
          id: tx.id,
          date: tx.date,
          description: tx.description,
          amount: Math.abs(tx.amount),
          type: tx.amount >= 0 ? ('credit' as const) : ('debit' as const),
          balance: tx.balance,
        })),
        dateLocale,
        t: (key, values) => tPdf(key, values),
      });
    } catch {
      setPdfError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadTransactionDetail = async (tx: ManagedTransaction) => {
    setPdfError(false);
    try {
      await generateTransactionDetailPdf({
        ownerName,
        accountLabel,
        maskedNumber,
        transaction: tx,
        currency: account.currency,
        dateLocale,
        t: (key, values) => tTxPdf(key, values),
      });
    } catch {
      setPdfError(true);
    }
  };

  return (
    <div className="px-5 py-4 space-y-4">
      <div>
        <h3 className="text-fg text-sm font-semibold">{maskedNumber}</h3>
        <p className="text-xs text-fg-muted">
          {ownerName}
          {account.kind === 'investment' && ` · ${t('investmentNote')}`}
        </p>
      </div>

      {/* Filtres de période (envoyés au backend) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-fg-muted text-xs mb-1.5">{t('startDate')}</label>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-fg-muted text-xs mb-1.5">{t('endDate')}</label>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      {!rangeValid && <p className="text-warning text-xs">{t('invalidRange')}</p>}

      <button
        type="button"
        onClick={() => void downloadStatement()}
        disabled={isGenerating || isLoading || !rangeValid}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover transition disabled:opacity-50"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {isGenerating ? t('generating') : t('downloadStatement')}
      </button>
      {pdfError && <p className="text-xs text-danger">{t('pdfError')}</p>}

      {/* Liste des transactions */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{t('loadError')}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-fg-muted">{t('empty')}</p>
      ) : (
        <ul className="divide-y divide-edge rounded-xl border border-edge bg-input">
          {items.map((tx) => {
            const isCredit = tx.amount >= 0;
            const isExpanded = expandedId === tx.id;
            return (
              <li key={tx.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-fg">{tx.description || '—'}</span>
                    <span className="block text-xs text-fg-muted">
                      {new Date(tx.date).toLocaleDateString(dateLocale)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-sm font-semibold ${isCredit ? 'text-tertiary' : 'text-danger'}`}
                  >
                    {isCredit ? '+' : '-'} {money(tx.amount)}
                  </span>
                </button>
                {isExpanded && (
                  <div className="space-y-2 border-t border-edge bg-input px-3 py-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-fg-muted">
                      <span>{t('detail.balanceAfter')}</span>
                      <span className="text-right text-fg">{money(tx.balance)}</span>
                      <span>{t('detail.type')}</span>
                      <span className="text-right text-fg">
                        {isCredit ? t('detail.credit') : t('detail.debit')}
                      </span>
                      <span>{t('detail.reference')}</span>
                      <span className="truncate text-right text-fg">{tx.id}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void downloadTransactionDetail(tx)}
                      className="w-full rounded-lg border border-edge-strong bg-hover px-3 py-2 text-xs font-semibold text-fg-secondary hover:bg-hover-strong transition"
                    >
                      {t('downloadDetail')}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
