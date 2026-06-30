'use client';

import { useAuth } from '@/hooks/useAuth';

export default function DashboardAdminPage() {
  const { user } = useAuth();

  const isDirector = user?.roles?.includes('DIRECTOR') ?? false;

  if (!isDirector) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-sm">Access restricted</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-white mb-2">Admin</h1>
      <p className="text-gray-500 text-sm mb-6">Director-level administration panel.</p>

      <div className="bg-[#111318] rounded-2xl border border-white/5 p-8 text-center">
        <p className="text-gray-600 text-sm">Admin panel — coming soon</p>
      </div>
    </div>
  );
}
