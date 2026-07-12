'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { ClientAccounts, ManagedAccount } from '@/features/users/types';

/**
 * Les trois comptes du client (Checking, Savings, Investment) en cartes
 * cliquables — lecture seule, ouvre la vue transactions dans la même modale.
 */
export function ClientAccountsPanel({
  accounts,
  onOpenAccount,
}: {
  accounts: ClientAccounts;
  onOpenAccount: (account: ManagedAccount) => void;
}) {
  const t = useTranslations('users.accounts');
  const locale = useLocale();
  const money = (n: number, currency: string) =>
    n.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency });

  const items: ManagedAccount[] = [
    ...accounts.accounts.map((a) => ({ ...a, kind: 'bank' as const })),
    ...accounts.investmentAccounts.map((a) => ({ ...a, kind: 'investment' as const })),
  ];

  if (items.length === 0) {
    return <p className="text-sm text-fg-muted">{t('empty')}</p>;
  }

  return (
    <div>
      <p className="text-xs text-fg-muted mb-2">{t('title')}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {items.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => onOpenAccount(account)}
            className="rounded-xl border border-white/5 bg-black/20 p-3 text-left transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                {t(`types.${account.type}`)}
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  account.status === 'active' ? 'bg-tertiary' : 'bg-red-400'
                }`}
                title={t(`status.${account.status}` as never)}
                aria-hidden="true"
              />
            </div>
            <p className="mt-1 text-sm font-semibold text-white">
              {account.kind === 'bank'
                ? money(account.balance, account.currency)
                : money(account.totalValue, account.currency)}
            </p>
            <p className="truncate text-[11px] text-fg-subtle">
              {account.kind === 'bank' ? account.iban : account.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
