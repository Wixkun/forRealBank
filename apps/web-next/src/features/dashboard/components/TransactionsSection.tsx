'use client';

import { useState, useEffect } from 'react';
import { Account, DisplayTransaction, fmt, fmtDate, accountLabel } from '@/features/dashboard/types';

// ── Chart ─────────────────────────────────────────────────────────────────────

type ChartPoint = DisplayTransaction & { balance: number };

function AccountChart({ transactions, currentBalance }: {
  transactions: DisplayTransaction[];
  currentBalance?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const fmtA = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  if (transactions.length === 0) {
    return <div className="flex items-center justify-center h-28 text-gray-600 text-sm">Pas assez de données</div>;
  }

  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const hasBalance = sorted.some((t) => t.balance != null);

  const W = 560; const H = 110;
  const PL = 52; const PR = 16; const PT = 8; const PB = 24;
  const cW = W - PL - PR; const cH = H - PT - PB;

  if (hasBalance) {
    let points = sorted.filter((t) => t.balance != null) as ChartPoint[];
    const last = points[points.length - 1];
    if (currentBalance != null && last && Math.abs(currentBalance - last.balance) > 0.01) {
      points = [...points, {
        id: '__now__', date: new Date().toISOString().split('T')[0],
        description: 'Solde actuel', amount: 0, type: 'credit' as const, balance: currentBalance,
      }];
    }

    const minB = Math.min(...points.map((t) => t.balance));
    const maxB = Math.max(...points.map((t) => t.balance));
    const range = maxB - minB || 1;
    const px = (i: number) => PL + (i / Math.max(points.length - 1, 1)) * cW;
    const py = (b: number) => PT + cH - ((b - minB) / range) * cH;
    const linePath = points.map((t, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(t.balance).toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${px(points.length - 1).toFixed(1)} ${PT + cH} L ${PL} ${PT + cH} Z`;
    const hovPt = hovered != null ? points[hovered] : null;

    return (
      <div className="relative select-none">
        {hovPt && hovered != null && (
          <div
            className="absolute z-10 pointer-events-none bg-[#1a1d24] border border-white/10 rounded-lg px-2.5 py-1.5 shadow-xl text-xs whitespace-nowrap"
            style={{ left: `${(px(hovered) / W) * 100}%`, top: '-8px', transform: 'translate(-50%, -100%)' }}
          >
            <p className="text-gray-500 mb-0.5">{new Date(hovPt.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            {hovPt.id !== '__now__' && (
              <>
                <p className="text-gray-300 truncate max-w-40 mb-0.5">{hovPt.description}</p>
                <p className={`font-mono font-semibold ${hovPt.type === 'credit' ? 'text-teal-400' : 'text-red-400'}`}>
                  {hovPt.type === 'credit' ? '+' : '−'}{fmtA(hovPt.amount)}
                </p>
              </>
            )}
            <p className="text-white font-mono font-semibold mt-0.5">Solde : {fmtA(hovPt.balance)}</p>
          </div>
        )}
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((r) => {
            const gy = PT + cH - r * cH;
            return (
              <g key={r}>
                <line x1={PL} y1={gy} x2={W - PR} y2={gy} stroke="#ffffff0d" strokeWidth="1" />
                <text x={PL - 5} y={gy + 4} textAnchor="end" fontSize="9" fill="#4b5563">{fmtA(minB + r * range)}</text>
              </g>
            );
          })}
          <path d={areaPath} fill="url(#cg)" />
          <path d={linePath} fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinejoin="round" />
          {points.map((t, i) => (
            <g key={t.id}>
              <circle cx={px(i)} cy={py(t.balance)} r={hovered === i ? 4 : 2.5}
                fill={hovered === i ? '#fff' : '#2dd4bf'} stroke={hovered === i ? '#2dd4bf' : 'none'} strokeWidth="1.5" />
              <circle cx={px(i)} cy={py(t.balance)} r={14} fill="transparent" className="cursor-pointer"
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
            </g>
          ))}
          {[0, Math.floor(points.length / 2), points.length - 1]
            .filter((i, idx, arr) => arr.indexOf(i) === idx && points[i])
            .map((i) => (
              <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#4b5563">
                {new Date(points[i].date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </text>
            ))}
        </svg>
      </div>
    );
  }

  const maxAmt = Math.max(...sorted.map((t) => t.amount), 1);
  const barW = Math.max(6, Math.floor(cW / sorted.length) - 3);
  const hovTx = hovered != null ? sorted[hovered] : null;

  return (
    <div className="relative select-none">
      {hovTx && hovered != null && (
        <div
          className="absolute z-10 pointer-events-none bg-[#1a1d24] border border-white/10 rounded-lg px-2.5 py-1.5 shadow-xl text-xs whitespace-nowrap"
          style={{ left: `${((PL + (hovered + 0.5) * (cW / sorted.length)) / W) * 100}%`, top: '-8px', transform: 'translate(-50%, -100%)' }}
        >
          <p className="text-gray-500 mb-0.5">{new Date(hovTx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          <p className="text-gray-300 truncate max-w-40 mb-0.5">{hovTx.description}</p>
          <p className={`font-mono font-semibold ${hovTx.type === 'credit' ? 'text-teal-400' : 'text-red-400'}`}>
            {hovTx.type === 'credit' ? '+' : '−'}{fmtA(hovTx.amount)}
          </p>
        </div>
      )}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {[0.5, 1].map((r) => {
          const gy = PT + cH - r * cH;
          return <line key={r} x1={PL} y1={gy} x2={W - PR} y2={gy} stroke="#ffffff0d" strokeWidth="1" />;
        })}
        <line x1={PL} y1={PT + cH} x2={W - PR} y2={PT + cH} stroke="#ffffff15" strokeWidth="1" />
        {sorted.map((t, i) => {
          const bH = Math.max(2, (t.amount / maxAmt) * cH);
          const cx = PL + (i + 0.5) * (cW / sorted.length);
          return (
            <g key={t.id}>
              <rect x={cx - barW / 2} y={PT + cH - bH} width={barW} height={bH}
                fill={t.type === 'credit' ? '#2dd4bf' : '#f87171'} rx="2" opacity={hovered === i ? 1 : 0.65} />
              <rect x={cx - Math.max(barW, 18) / 2} y={PT} width={Math.max(barW, 18)} height={cH}
                fill="transparent" className="cursor-pointer"
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
            </g>
          );
        })}
        {[0, Math.floor(sorted.length / 2), sorted.length - 1]
          .filter((i, idx, arr) => arr.indexOf(i) === idx && sorted[i])
          .map((i) => (
            <text key={i} x={PL + (i + 0.5) * (cW / sorted.length)} y={H - 4} textAnchor="middle" fontSize="9" fill="#4b5563">
              {new Date(sorted[i].date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </text>
          ))}
      </svg>
    </div>
  );
}

// ── Period filter ─────────────────────────────────────────────────────────────

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'day',   label: 'Jour'    },
  { key: 'week',  label: 'Semaine' },
  { key: 'month', label: 'Mois'    },
  { key: 'year',  label: 'Année'   },
  { key: 'all',   label: 'Tout'    },
];

function filterByPeriod(txns: DisplayTransaction[], p: Period): DisplayTransaction[] {
  if (p === 'all') return txns;
  const cutoff = new Date();
  if (p === 'day')   cutoff.setDate(cutoff.getDate() - 1);
  if (p === 'week')  cutoff.setDate(cutoff.getDate() - 7);
  if (p === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
  if (p === 'year')  cutoff.setFullYear(cutoff.getFullYear() - 1);
  return txns.filter((t) => new Date(t.date) >= cutoff);
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  accounts: Account[];
  selectedAccountId: string | null;
};

export function TransactionsSection({ accounts, selectedAccountId }: Props) {
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>('month');
  const [showChart, setShowChart] = useState(false);

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferSourceId, setTransferSourceId] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const selectedAccount = selectedAccountId
    ? accounts.find((a) => a.id === selectedAccountId) ?? null
    : null;

  const sourceOptions = accounts.filter((a) => a.id !== selectedAccountId);
  const transferSource = transferSourceId
    ? accounts.find((a) => a.id === transferSourceId) ?? null
    : sourceOptions[0] ?? null;

  const loadActivities = async (acc: Account) => {
    setLoading(true);
    try {
      const isInvestment = acc.accountType === 'investment' || acc.type === 'investment';
      const url = isInvestment
        ? `/api/trading/activities/${acc.id}`
        : `/api/transactions/account/${acc.id}?limit=500`;

      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) { setTransactions([]); return; }

      const data = await res.json();
      const raw: Array<Record<string, unknown>> = Array.isArray(data) ? data : (data.transactions ?? []);

      setTransactions(raw.map((t) => {
        const rawAmount = t.amount as number;
        return {
          id: t.id as string,
          date: (t.date as string) || new Date().toISOString(),
          description: (t.description as string) || '',
          amount: Math.abs(rawAmount),
          type: rawAmount >= 0 ? ('credit' as const) : ('debit' as const),
          balance: t.balance != null ? (t.balance as number) : undefined,
        };
      }));
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

  const handleTransfer = async () => {
    if (!transferSource || !selectedAccount || !transferAmount) return;
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) { setTransferError('Montant invalide'); return; }
    if (amount > transferSource.balance) { setTransferError('Fonds insuffisants'); return; }

    const sourceType =
      transferSource.accountType === 'investment' || transferSource.type === 'investment'
        ? 'investment' : 'bank';

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
      if (!data.success) { setTransferError(data.error || 'Échec du virement'); return; }

      setShowTransfer(false);
      setTransferAmount('');
      await loadActivities(selectedAccount);
      window.location.reload();
    } catch {
      setTransferError('Erreur réseau');
    } finally {
      setTransferLoading(false);
    }
  };

  const displayed = filterByPeriod(transactions, period);

  return (
    <div className="bg-[#111318] rounded-2xl border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          Transactions
          {selectedAccount && (
            <span className="text-teal-400 font-normal text-xs">— {accountLabel(selectedAccount)}</span>
          )}
        </h3>

        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-0.5">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                period === key
                  ? 'bg-teal-500/25 text-teal-300 border border-teal-500/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {selectedAccount && (
            <button
              onClick={() => { setShowChart((v) => !v); setShowTransfer(false); }}
              className={`w-7 h-7 flex items-center justify-center rounded-lg border transition ${
                showChart
                  ? 'bg-teal-500/30 border-teal-500/50 text-teal-300'
                  : 'border-white/10 text-gray-500 hover:text-teal-300 hover:border-teal-500/30'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </button>
          )}
          {selectedAccount && sourceOptions.length > 0 && (
            <button
              onClick={() => { setShowTransfer((v) => !v); setTransferError(null); }}
              className="text-xs px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/30 transition"
            >
              + Alimenter
            </button>
          )}
        </div>
      </div>

      {/* Inline transfer form */}
      {showTransfer && selectedAccount && sourceOptions.length > 0 && (
        <div className="px-5 py-4 border-b border-white/5 bg-teal-950/30">
          <p className="text-teal-300 text-xs mb-2 font-medium">
            Depuis → vers {accountLabel(selectedAccount)}
          </p>
          <div className="flex items-center gap-2">
            <select
              value={transferSourceId ?? sourceOptions[0]?.id ?? ''}
              onChange={(e) => setTransferSourceId(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500/50"
            >
              {sourceOptions.map((a) => (
                <option key={a.id} value={a.id}>{accountLabel(a)} — {fmt(a.balance)}</option>
              ))}
            </select>
            <input
              type="number" min="1" step="0.01" placeholder="Montant (€)"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/50"
            />
            <button
              onClick={handleTransfer}
              disabled={transferLoading || !transferAmount}
              className="px-4 py-1.5 rounded-lg bg-teal-500 text-gray-900 text-xs font-semibold hover:bg-teal-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {transferLoading ? '...' : 'Virer'}
            </button>
            <button
              onClick={() => { setShowTransfer(false); setTransferError(null); setTransferAmount(''); }}
              className="text-gray-500 text-xs hover:text-gray-300 transition"
            >
              Annuler
            </button>
          </div>
          {transferError && <p className="text-red-400 text-xs mt-2">{transferError}</p>}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="px-5 py-10 text-center text-gray-600 text-sm">Loading...</div>
      ) : showChart ? (
        <div className="px-5 py-4">
          <AccountChart transactions={displayed} currentBalance={selectedAccount?.balance} />
        </div>
      ) : displayed.length === 0 ? (
        <div className="px-5 py-10 text-center text-gray-600 text-sm">No transactions for this account</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-5 py-2.5 text-gray-600 text-xs font-medium">Date</th>
              <th className="text-left px-5 py-2.5 text-gray-600 text-xs font-medium">Description</th>
              <th className="text-left px-5 py-2.5 text-gray-600 text-xs font-medium">Category</th>
              <th className="text-right px-5 py-2.5 text-gray-600 text-xs font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((tx) => (
              <tr key={tx.id} className="border-t border-white/4 hover:bg-white/2 transition-colors">
                <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(tx.date)}</td>
                <td className="px-5 py-3 text-gray-200 text-xs">{tx.description}</td>
                <td className="px-5 py-3 text-gray-500 text-xs capitalize">{tx.type}</td>
                <td className={`px-5 py-3 text-right font-mono text-xs font-semibold ${tx.type === 'credit' ? 'text-teal-400' : 'text-red-400'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
