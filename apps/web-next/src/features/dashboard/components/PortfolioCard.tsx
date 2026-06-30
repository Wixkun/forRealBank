'use client';

import { Account, fmt, accountLabel, lastFour } from '@/features/dashboard/types';

function BankWatermark() {
  return (
    <svg width="160" height="160" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21h18M3 10h18M12 3L2 10h20L12 3zM5 10v11M9 10v11M15 10v11M19 10v11"
        stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

type Props = {
  accounts: Account[];
  totalBalance: number;
  selectedAccountId: string | null;
  onSelectAccount: (acc: Account) => void;
};

export function PortfolioCard({ accounts, totalBalance, selectedAccountId, onSelectAccount }: Props) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden p-6"
      style={{ background: 'linear-gradient(135deg, #0d4a47 0%, #0a3a37 50%, #073030 100%)' }}
    >
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.07] pointer-events-none">
        <BankWatermark />
      </div>

      <div className="relative">
        <p className="text-teal-300/60 text-xs font-mono tracking-widest uppercase mb-2">
          Total Portfolio Balance
        </p>
        <h2 className="text-4xl font-bold text-white font-mono mb-6 tracking-tight">
          {fmt(totalBalance)}
        </h2>

        {accounts.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {accounts.slice(0, 3).map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => onSelectAccount(acc)}
                  className={`backdrop-blur-sm rounded-xl p-3 border text-left transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-teal-900/30 border-teal-500/60 ring-1 ring-teal-500/30'
                      : 'bg-black/25 border-white/5 hover:bg-black/40 hover:border-teal-500/30'
                  }`}
                >
                  <p className={`text-[11px] font-mono truncate transition-colors ${
                    isSelected ? 'text-teal-300' : 'text-teal-200/50 group-hover:text-teal-300/70'
                  }`}>
                    {accountLabel(acc)} (···{lastFour(acc)})
                  </p>
                  <p className="text-white font-semibold text-sm mt-1.5 font-mono">
                    {fmt(acc.balance)}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-teal-200/40 text-sm">No accounts yet</p>
        )}
      </div>
    </div>
  );
}
