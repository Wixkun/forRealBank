'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ModalShell } from '@/components/ui/ModalShell';
import type { Account } from '@/features/dashboard/types';
import { accountLabel, lastFour } from '@/features/dashboard/types';
import { fetchAccounts, fetchAccountTransactions } from '@/features/dashboard/api';
import { generateStatementPdf } from '@/features/statements/generateStatementPdf';
import type { StatementPrefill } from '@/features/statements/StatementContext';

const toInputDate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Dates initiales déduites du filtre de période actif du dashboard
function initialRange(prefill: StatementPrefill): { start: string; end: string } {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  switch (prefill.period) {
    case 'day':
      return { start: toInputDate(today), end: toInputDate(today) };
    case 'week': {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      return { start: toInputDate(start), end: toInputDate(today) };
    }
    case 'year':
      return { start: toInputDate(new Date(today.getFullYear(), 0, 1)), end: toInputDate(today) };
    case 'all':
      if (prefill.txRange) {
        return {
          start: toInputDate(new Date(prefill.txRange.first)),
          end: toInputDate(new Date(prefill.txRange.last)),
        };
      }
      return { start: toInputDate(new Date(today.getFullYear(), 0, 1)), end: toInputDate(today) };
    case 'month':
    default:
      return { start: toInputDate(startOfMonth), end: toInputDate(today) };
  }
}

type QuickRange = {
  key: 'thisMonth' | 'lastMonth' | 'thisYear';
  range: () => { start: string; end: string };
};

const QUICK_RANGES: QuickRange[] = [
  {
    key: 'thisMonth',
    range: () => {
      const now = new Date();
      return {
        start: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: toInputDate(now),
      };
    },
  },
  {
    key: 'lastMonth',
    range: () => {
      const now = new Date();
      return {
        start: toInputDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        end: toInputDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    },
  },
  {
    key: 'thisYear',
    range: () => {
      const now = new Date();
      return { start: toInputDate(new Date(now.getFullYear(), 0, 1)), end: toInputDate(now) };
    },
  },
];

const inputClass =
  'w-full bg-input border border-edge-strong rounded-lg px-3 py-2 text-fg text-sm focus:outline-none focus:border-primary/60 [color-scheme:dark]';

export function StatementModal({
  prefill,
  onCloseAction,
}: {
  prefill: StatementPrefill;
  onCloseAction: () => void;
}) {
  const t = useTranslations('statements');
  const tPdf = useTranslations('statements.pdf');
  const locale = useLocale();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [clientName, setClientName] = useState('');
  const [accountId, setAccountId] = useState(prefill.accountId ?? '');
  const [{ start, end }, setRange] = useState(() => initialRange(prefill));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [accs, meRes] = await Promise.all([
          fetchAccounts(),
          fetch('/api/auth/me', { credentials: 'include' }),
        ]);
        if (cancelled) return;
        setAccounts(accs);
        setAccountId((prev) =>
          prev && accs.some((a) => a.id === prev) ? prev : (accs[0]?.id ?? ''),
        );
        if (meRes.ok) {
          const me = await meRes.json();
          if (!cancelled && me?.user)
            setClientName(`${me.user.firstName} ${me.user.lastName}`.trim());
        }
      } catch {
        if (!cancelled) setError(t('loadError'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? null;
  const datesValid = Boolean(start && end && start <= end);

  const handleDownload = async () => {
    if (!selectedAccount || !datesValid) return;
    setGenerating(true);
    setError(null);
    try {
      const periodStart = new Date(`${start}T00:00:00`);
      const periodEnd = new Date(`${end}T23:59:59.999`);
      const transactions = (await fetchAccountTransactions(selectedAccount))
        .filter((t) => {
          const d = new Date(t.date);
          return d >= periodStart && d <= periodEnd;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      await generateStatementPdf({
        clientName: clientName || '—',
        accountLabel: accountLabel(selectedAccount),
        accountName: selectedAccount.name,
        maskedNumber: `${accountLabel(selectedAccount)} (…${lastFour(selectedAccount)})`,
        iban: selectedAccount.iban ?? null,
        currency: 'EUR',
        currentBalance: selectedAccount.balance,
        periodStart,
        periodEnd: new Date(`${end}T00:00:00`),
        transactions,
        dateLocale: locale === 'fr' ? 'fr-FR' : 'en-US',
        t: (key, values) => tPdf(key, values),
      });
      onCloseAction();
    } catch {
      setError(t('generateError'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ModalShell onCloseAction={onCloseAction} maxWidthClass="max-w-md">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-edge">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-tertiary">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="13" y2="17" />
            </svg>
          </div>
          <h2 className="text-fg text-sm font-semibold">{t('title')}</h2>
        </div>
        <button
          onClick={onCloseAction}
          className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-hover transition"
          aria-label={t('close')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <label className="block text-fg-muted text-xs mb-1.5">{t('account')}</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className={inputClass}
          >
            {accounts.length === 0 && <option value="">{t('loadingAccounts')}</option>}
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {accountLabel(a)} (…{lastFour(a)}) — {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-fg-muted text-xs mb-1.5">{t('shortcuts')}</label>
          <div className="flex flex-wrap gap-2">
            {QUICK_RANGES.map((q) => (
              <button
                key={q.key}
                type="button"
                onClick={() => setRange(q.range())}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-hover text-fg-secondary border border-edge-strong hover:bg-primary/15 hover:text-tertiary hover:border-primary/40 transition"
              >
                {t(q.key)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-fg-muted text-xs mb-1.5">{t('startDate')}</label>
            <input
              type="date"
              value={start}
              max={end || undefined}
              onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-fg-muted text-xs mb-1.5">{t('endDate')}</label>
            <input
              type="date"
              value={end}
              min={start || undefined}
              onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        {!datesValid && start && end && <p className="text-warning text-xs">{t('invalidRange')}</p>}
        {error && <p className="text-danger text-xs">{error}</p>}
      </div>

      <div className="flex items-center gap-2 px-5 py-4 border-t border-edge">
        <button
          onClick={handleDownload}
          disabled={generating || !selectedAccount || !datesValid}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
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
          {generating ? t('generating') : t('download')}
        </button>
        <button
          onClick={onCloseAction}
          className="px-5 py-2.5 rounded-lg bg-hover text-fg-secondary text-xs font-semibold hover:bg-hover-strong transition"
        >
          {t('cancel')}
        </button>
      </div>
    </ModalShell>
  );
}
