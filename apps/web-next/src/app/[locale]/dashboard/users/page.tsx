'use client';

import { useAuth } from '@/hooks/useAuth';

export default function DashboardUsersPage() {
  const { user } = useAuth();

  const isAdvisor = user?.roles?.includes('ADVISOR') ?? false;
  const isDirector = user?.roles?.includes('DIRECTOR') ?? false;

  if (!isAdvisor && !isDirector) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-fg-muted text-sm">Access restricted</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-white mb-2">Users</h1>
      <p className="text-fg-muted text-sm mb-6">
        {isDirector ? 'Manage all clients and advisors.' : 'Manage your clients.'}
      </p>

      <div className="bg-surface-1 rounded-2xl border border-white/5 p-8 text-center">
        <p className="text-fg-muted text-sm">User management — coming soon</p>
      </div>
    </div>
  );
}
