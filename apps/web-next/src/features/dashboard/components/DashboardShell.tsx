'use client';

import type { ReactNode } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NotificationCenter } from '@/features/notifications/components/NotificationCenter';

// ── Icons ────────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
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
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function IconTrading() {
  return (
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
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
function IconBeneficiaires() {
  return (
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
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconAnalytics() {
  return (
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
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function IconMessage() {
  return (
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconUsersGroup() {
  return (
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
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconAdmin() {
  return (
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconLogout() {
  return (
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconTransfer() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function IconPayBill() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}
function IconCard() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
function IconMore() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}
function IconCalendar() {
  return (
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconDownload() {
  return (
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const isAdvisor = user?.roles?.includes('ADVISOR') ?? false;
  const isDirector = user?.roles?.includes('DIRECTOR') ?? false;

  const initials =
    ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase() || 'U';

  type NavItem = {
    icon: ReactNode;
    label: string;
    href: string;
    badge?: string;
    disabled?: boolean;
  };

  const navItems: NavItem[] = [
    { icon: <IconDashboard />, label: 'Dashboard', href: `/${locale}/dashboard` },
    { icon: <IconTrading />, label: 'Trading', href: `/${locale}/market` },
    ...(!isAdvisor && !isDirector
      ? [{ icon: <IconBeneficiaires />, label: 'Bénéficiaires', href: '#', disabled: true }]
      : []),
    { icon: <IconAnalytics />, label: 'Analytics', href: '#', disabled: true },
    { icon: <IconMessage />, label: 'Messages', href: `/${locale}/dashboard/messages` },
    ...(isAdvisor || isDirector
      ? [{ icon: <IconUsersGroup />, label: 'Users', href: `/${locale}/dashboard/users` }]
      : []),
    ...(isDirector
      ? [{ icon: <IconAdmin />, label: 'Admin', href: `/${locale}/dashboard/admin` }]
      : []),
  ];

  type QuickAction = {
    icon: ReactNode;
    label: string;
    href: string;
    disabled?: boolean;
  };

  const quickActions: QuickAction[] = [
    { icon: <IconTransfer />, label: 'Transfer', href: `/${locale}/dashboard/transfer` },
    { icon: <IconPayBill />, label: 'Pay Bill', href: '#', disabled: true },
    { icon: <IconCard />, label: 'Cards', href: '#', disabled: true },
    { icon: <IconMore />, label: 'More', href: '#', disabled: true },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/dashboard`) return pathname === href;
    if (href === '#') return false;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
    } catch {}
    router.push(`/${locale}/login`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0f14] text-white">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 bg-[#111318] flex flex-col border-r border-white/5">
        <div className="p-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-gray-900 shrink-0">
            FR
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-white truncate">ForRealBank</div>
            <div className="text-[10px] text-gray-400">Institutional Portal</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (!item.disabled && item.href !== '#') router.push(item.href);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-linear-to-r from-teal-500/20 to-cyan-500/10 text-cyan-400 border border-teal-500/20'
                  : item.disabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer'
              }`}
            >
              <span className={isActive(item.href) ? 'text-cyan-400' : 'text-current'}>
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

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 shrink-0">
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
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-gray-900">
              {initials}
            </div>
          </div>
        </div>

        {/* Content row */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center — only this part changes on navigation */}
          <main className="flex-1 overflow-y-auto p-6 space-y-5">{children}</main>

          {/* ── Right panel ──────────────────────────────────────────── */}
          <aside className="w-72 shrink-0 border-l border-white/5 overflow-y-auto p-5 space-y-5">
            <div className="bg-[#111318] rounded-2xl border border-white/5 p-4">
              <h3 className="font-semibold text-white text-sm mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      if (!action.disabled && action.href !== '#') router.push(action.href);
                    }}
                    className={`rounded-xl p-4 flex flex-col items-center gap-2 transition-colors border ${
                      action.disabled
                        ? 'cursor-not-allowed opacity-50 bg-white/4 border-white/5'
                        : isActive(action.href)
                          ? 'cursor-pointer bg-teal-500/10 border-teal-500/30'
                          : 'cursor-pointer bg-white/4 hover:bg-white/8 border-white/5'
                    }`}
                  >
                    <span className="text-cyan-400">{action.icon}</span>
                    <span className="text-xs text-gray-300">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

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
              <button className="w-full py-2.5 rounded-xl bg-linear-to-r from-teal-500 to-cyan-500 text-gray-900 font-semibold text-xs hover:from-teal-400 hover:to-cyan-400 transition-all">
                Schedule Payment
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
