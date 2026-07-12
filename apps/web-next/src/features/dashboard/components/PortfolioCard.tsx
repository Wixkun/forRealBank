'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Account, fmt, accountLabel, lastFour } from '@/features/dashboard/types';

function BankWatermark() {
  return (
    <svg width="160" height="160" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 21h18M3 10h18M12 3L2 10h20L12 3zM5 10v11M9 10v11M15 10v11M19 10v11"
        stroke="var(--pc-watermark)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  accounts: Account[];
  totalBalance: number;
  selectedAccountId: string | null;
  onSelectAccount: (acc: Account) => void;
};

export function PortfolioCard({
  accounts,
  totalBalance,
  selectedAccountId,
  onSelectAccount,
}: Props) {
  const t = useTranslations('dashboard.portfolioCard');
  const accountTypeLabels = {
    checking: t('accountTypes.checking'),
    savings: t('accountTypes.savings'),
    investment: t('accountTypes.investment'),
  };
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyIban = async (acc: Account) => {
    const value = acc.iban ?? acc.id;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
    setCopiedId(acc.id);
    window.setTimeout(() => {
      setCopiedId((current) => (current === acc.id ? null : current));
    }, 1500);
  };

  return (
    <div
      // Palette dédiée (variables --pc-*) redéfinie en clair par
      // [data-theme='light'] .portfolio-card dans globals.css : le dégradé
      // change de teinte (teal foncé → teal pastel), pas seulement le texte.
      className="portfolio-card relative rounded-2xl overflow-hidden p-6"
      style={{ background: 'var(--pc-bg)' }}
    >
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.07] pointer-events-none">
        <BankWatermark />
      </div>

      <div className="relative">
        <p
          className="text-xs font-mono tracking-widest uppercase mb-2"
          style={{ color: 'var(--pc-label)' }}
        >
          {t('totalBalance')}
        </p>
        <h2
          className="text-4xl font-bold font-mono mb-6 tracking-tight"
          style={{ color: 'var(--pc-heading)' }}
        >
          {fmt(totalBalance)}
        </h2>

        {accounts.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {accounts.slice(0, 3).map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              const isCopied = copiedId === acc.id;
              return (
                <div
                  key={acc.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectAccount(acc)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectAccount(acc);
                    }
                  }}
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--pc-tile-selected-bg)'
                      : 'var(--pc-tile-bg)',
                    borderColor: isSelected
                      ? 'var(--pc-tile-selected-border)'
                      : 'var(--pc-tile-border)',
                  }}
                  className={`relative backdrop-blur-sm rounded-xl p-3 border text-left transition-all cursor-pointer group ${
                    isSelected ? 'ring-1 ring-teal-500/30' : 'hover:bg-(--pc-tile-bg-hover)'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleCopyIban(acc);
                    }}
                    aria-label={t('copyIban')}
                    title={t('copyIban')}
                    style={{
                      color: isCopied ? 'var(--pc-copy-icon-hover)' : 'var(--pc-copy-icon)',
                    }}
                    className="absolute top-2 right-2 p-1 rounded-md transition-colors cursor-pointer hover:bg-hover-strong"
                  >
                    {isCopied ? <IconCheck /> : <IconCopy />}
                  </button>
                  <span role="status" className="sr-only">
                    {isCopied ? t('ibanCopied') : ''}
                  </span>

                  <p
                    className="text-xs font-mono truncate pr-5 transition-colors"
                    style={{
                      color: isSelected ? 'var(--pc-tile-label-selected)' : 'var(--pc-tile-label)',
                    }}
                  >
                    {accountLabel(acc, accountTypeLabels)} (···{lastFour(acc)})
                  </p>
                  <p
                    className="font-semibold text-sm mt-1.5 font-mono"
                    style={{ color: 'var(--pc-tile-value)' }}
                  >
                    {fmt(acc.balance)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--pc-empty-text)' }}>
            {t('noAccounts')}
          </p>
        )}
      </div>
    </div>
  );
}
