'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import NewsFeed from '@/components/feed/NewsFeed';

type DashboardContentProps = {
  translations: {
    greeting: string;
    totalBalance: string;
    accounts: string;
    recentTransactions: string;
    quickActions: {
      send: string;
      receive: string;
      chat: string;
      director: string;
      more: string;
    };
    accountTypes: {
      checking: string;
      savings: string;
    };
  };
  accountData: {
    user: { firstName: string; lastName: string; email: string };
    accounts: Array<{
      id: string;
      name: string;
      balance: number;
      iban?: string;
      type: string;
      accountType?: 'banking' | 'investment';
    }>;
    recentTransactions: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
      type: 'credit' | 'debit';
    }>;
  };
  totalBalance: number;
  locale: string;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const lastFour = (acc: DashboardContentProps['accountData']['accounts'][0]) =>
  (acc.iban ?? acc.id).slice(-4).toUpperCase();

const accountLabel = (acc: DashboardContentProps['accountData']['accounts'][0]) => {
  if (acc.accountType === 'investment' || acc.type === 'investment') return 'Investment';
  const t = (acc.type ?? '').toLowerCase();
  if (t.includes('saving')) return 'Savings';
  return 'Checking';
};

// ── Icons ────────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function IconTrading() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconAnalytics() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function IconMessage() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconTransfer() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function IconPayBill() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}
function IconCard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
function IconMore() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function BankWatermark() {
  return (
    <svg width="160" height="160" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21h18M3 10h18M12 3L2 10h20L12 3zM5 10v11M9 10v11M15 10v11M19 10v11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

type DisplayTransaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance?: number;
};

// ── Mini chart ────────────────────────────────────────────────────────────────

type ChartPoint = DisplayTransaction & { balance: number };

function AccountChart({ transactions, currentBalance }: { transactions: DisplayTransaction[], currentBalance?: number }) {
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

    // Ensure last point always matches current account balance
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
    const gridRatios = [0, 0.5, 1];
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
                <p className="text-gray-300 truncate max-w-[160px] mb-0.5">{hovPt.description}</p>
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
          {gridRatios.map((r) => {
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
                fill={hovered === i ? '#fff' : '#2dd4bf'}
                stroke={hovered === i ? '#2dd4bf' : 'none'} strokeWidth="1.5" />
              <circle cx={px(i)} cy={py(t.balance)} r={14} fill="transparent"
                className="cursor-pointer"
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

  // Bar chart — credit / debit
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
          <p className="text-gray-300 truncate max-w-[160px] mb-0.5">{hovTx.description}</p>
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
                fill={t.type === 'credit' ? '#2dd4bf' : '#f87171'} rx="2"
                opacity={hovered === i ? 1 : 0.65} />
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
type AccountItem = DashboardContentProps['accountData']['accounts'][0];

export function DashboardContent({ accountData, totalBalance, locale }: DashboardContentProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountTransactions, setAccountTransactions] = useState<DisplayTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const [showChart, setShowChart] = useState(false);

  // Transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferSourceId, setTransferSourceId] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const selectedAccount = selectedAccountId
    ? accountData.accounts.find((a) => a.id === selectedAccountId) ?? null
    : null;

  // Accounts that can be used as source (all except the selected destination)
  const sourceOptions = accountData.accounts.filter((a) => a.id !== selectedAccountId);
  const transferSource = transferSourceId
    ? accountData.accounts.find((a) => a.id === transferSourceId) ?? null
    : sourceOptions[0] ?? null;

  // Auto-select checking account on first load
  useEffect(() => {
    if (selectedAccountId !== null || accountData.accounts.length === 0) return;
    const checking = accountData.accounts.find(
      (a) => a.accountType === 'banking' && (a.type === 'checking' || a.type?.includes('check')),
    ) ?? accountData.accounts[0];
    if (checking) {
      setSelectedAccountId(checking.id);
      loadActivities(checking);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountData.accounts]);

  const loadActivities = async (acc: AccountItem) => {
    setTxLoading(true);
    try {
      const isInvestment = acc.accountType === 'investment' || acc.type === 'investment';
      const url = isInvestment
        ? `/api/trading/activities/${acc.id}`
        : `/api/transactions/account/${acc.id}?limit=10`;

      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) { setAccountTransactions([]); return; }

      const data = await res.json();
      const raw: Array<Record<string, unknown>> = Array.isArray(data)
        ? data
        : (data.transactions ?? []);

      setAccountTransactions(
        raw.map((t) => ({
          id: t.id as string,
          date: (t.date as string) || new Date().toISOString(),
          description: (t.description as string) || '',
          amount: Math.abs(t.amount as number),
          type: (t.type as string) === 'credit' ? ('credit' as const) : ('debit' as const),
          balance: t.balance != null ? (t.balance as number) : undefined,
        })),
      );
    } catch {
      setAccountTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };

  const selectAccount = async (acc: AccountItem) => {
    if (selectedAccountId === acc.id) return; // always keep one selected
    setSelectedAccountId(acc.id);
    setShowTransfer(false);
    setTransferError(null);
    setTransferSourceId(null);
    await loadActivities(acc);
  };

  const handleTransfer = async () => {
    if (!transferSource || !selectedAccount || !transferAmount) return;
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) { setTransferError('Montant invalide'); return; }
    if (amount > transferSource.balance) { setTransferError('Fonds insuffisants'); return; }

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

  const displayedTransactions = accountTransactions;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
    } catch {}
    router.push(`/${locale}/login`);
  };

  const initials =
    ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase() || 'U';

  const navItems = [
    { icon: <IconDashboard />, label: 'Dashboard', href: `/${locale}/dashboard`, active: true },
    { icon: <IconTrading />, label: 'Trading', href: `/${locale}/trading` },
    { icon: <IconUsers />, label: 'Bénéficiaires', href: '#', disabled: true },
    { icon: <IconAnalytics />, label: 'Analytics', href: '#', disabled: true },
    { icon: <IconMessage />, label: 'Messages', href: `/${locale}/chat`, badge: 'New' },
  ];

  const quickActions = [
    { icon: <IconTransfer />, label: 'Transfer', href: `/${locale}/transfer` },
    { icon: <IconPayBill />, label: 'Pay Bill', href: '#', disabled: true },
    { icon: <IconCard />, label: 'Cards', href: '#', disabled: true },
    { icon: <IconMore />, label: 'More', href: '#', disabled: true },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0f14] text-white">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 bg-[#111318] flex flex-col border-r border-white/5">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-gray-900 flex-shrink-0">
            FR
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-white truncate">ForRealBank</div>
            <div className="text-[10px] text-gray-400">Institutional Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (!item.disabled && item.href !== '#') router.push(item.href);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-cyan-400 border border-teal-500/20'
                  : item.disabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer'
              }`}
            >
              <span className={item.active ? 'text-cyan-400' : 'text-current'}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] bg-cyan-500 text-gray-900 px-1.5 py-0.5 rounded-full font-bold leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <IconLogout />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 flex-shrink-0">
          <div>
            <p className="text-white text-sm font-medium">
              Welcome back, {user?.firstName || '...'}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              Here&apos;s your financial overview for today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-300 hover:bg-white/5 transition-colors flex items-center gap-1.5">
              <IconDownload /> Statement
            </button>
            {user?.id && <NotificationCenter userId={user.id} />}
            <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 transition">
              <IconSettings />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-gray-900">
              {initials}
            </div>
          </div>
        </div>

        {/* Main row */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── Main content ─────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* Portfolio card */}
            <div className="relative rounded-2xl overflow-hidden p-6"
              style={{ background: 'linear-gradient(135deg, #0d4a47 0%, #0a3a37 50%, #073030 100%)' }}>
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
                {accountData.accounts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {accountData.accounts.slice(0, 3).map((acc) => {
                      const isSelected = selectedAccountId === acc.id;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => selectAccount(acc)}
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

            {/* Transactions */}
            <div className="bg-[#111318] rounded-2xl border border-white/5">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  Recent Transactions
                  {selectedAccount && (
                    <span className="text-teal-400 font-normal text-xs">
                      — {accountLabel(selectedAccount)}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {selectedAccount && (
                    <button
                      onClick={() => { setShowChart((v) => !v); setShowTransfer(false); }}
                      title="Voir en graphique"
                      className={`w-7 h-7 flex items-center justify-center rounded-lg border transition ${
                        showChart
                          ? 'bg-teal-500/30 border-teal-500/50 text-teal-300'
                          : 'border-white/10 text-gray-500 hover:text-teal-300 hover:border-teal-500/30'
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
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

              {/* Transfer form */}
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
                        <option key={a.id} value={a.id}>
                          {accountLabel(a)} — {fmt(a.balance)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Montant (€)"
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
                  {transferError && (
                    <p className="text-red-400 text-xs mt-2">{transferError}</p>
                  )}
                </div>
              )}
              {txLoading ? (
                <div className="px-5 py-10 text-center text-gray-600 text-sm">Loading...</div>
              ) : showChart ? (
                <div className="px-5 py-4">
                  <AccountChart transactions={displayedTransactions} currentBalance={selectedAccount?.balance} />
                </div>
              ) : displayedTransactions.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-600 text-sm">
                  No transactions for this account
                </div>
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
                    {displayedTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {fmtDate(tx.date)}
                        </td>
                        <td className="px-5 py-3 text-gray-200 text-xs">{tx.description}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs capitalize">{tx.type}</td>
                        <td
                          className={`px-5 py-3 text-right font-mono text-xs font-semibold ${
                            tx.type === 'credit' ? 'text-teal-400' : 'text-red-400'
                          }`}
                        >
                          {tx.type === 'credit' ? '+' : '-'}
                          {fmt(Math.abs(tx.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* News feed */}
            <div className="bg-[#111318] rounded-2xl border border-white/5 overflow-hidden">
              <NewsFeed userRoles={user?.roles ?? null} userId={user?.id ?? null} />
            </div>
          </main>

          {/* ── Right panel ──────────────────────────────────────────── */}
          <aside className="w-72 flex-shrink-0 border-l border-white/5 overflow-y-auto p-5 space-y-5">

            {/* Quick Actions */}
            <div className="bg-[#111318] rounded-2xl border border-white/5 p-4">
              <h3 className="font-semibold text-white text-sm mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      if (!action.disabled && action.href !== '#') router.push(action.href);
                    }}
                    className={`bg-white/[0.04] hover:bg-white/[0.08] rounded-xl p-4 flex flex-col items-center gap-2 transition-colors border border-white/5 ${
                      action.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                  >
                    <span className="text-cyan-400">{action.icon}</span>
                    <span className="text-xs text-gray-300">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming Payments */}
            <div className="bg-[#111318] rounded-2xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white text-sm">Upcoming Payments</h3>
                <span className="text-gray-500">
                  <IconCalendar />
                </span>
              </div>
              <div className="py-8 text-center">
                <p className="text-gray-600 text-xs">No upcoming payments</p>
                <p className="text-gray-700 text-[10px] mt-1">Feature coming soon</p>
              </div>
              <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-gray-900 font-semibold text-xs hover:from-teal-400 hover:to-cyan-400 transition-all">
                Schedule Payment
              </button>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
