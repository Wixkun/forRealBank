'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch, ApiError } from '@/lib/api-client';

type UserRow = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  isBanned?: boolean;
};

type UsersListResponse = {
  success: boolean;
  total: number;
  items: UserRow[];
};

export default function DashboardAdminPage() {
  const pathname = usePathname();
  const locale = useMemo(() => pathname.split('/')[1] || 'en', [pathname]);

  const t = useTranslations('director');
  const { user } = useAuth();

  const isDirector = user?.roles?.includes('DIRECTOR') ?? false;

  const [q, setQ] = useState('');
  const [serverItems, setServerItems] = useState<UserRow[]>([]);
  const [items, setItems] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<number | null>(null);
  const banRedirectedRef = useRef(false);

  const load = async (search?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const term = (search ?? q).trim();
      if (term) params.set('q', term);
      const qs = params.toString();
      const res = await apiFetch<UsersListResponse>(`/users${qs ? `?${qs}` : ''}`);
      const nextItems = res.items || [];
      setServerItems(nextItems);
      // total affiché = items.length (filtre front), donc pas besoin de stocker un total séparé.
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'BANNED') {
        // on redirige une seule fois
        if (!banRedirectedRef.current) {
          banRedirectedRef.current = true;
          window.location.href = `/${locale}/banned`;
        }
        return;
      }
      setError(e instanceof Error ? e.message : String(e));
      setServerItems([]);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isDirector) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirector]);

  // Filtre côté front : email + prénom + nom (insensible à la casse).
  useEffect(() => {
    const term = q.trim().toLowerCase();
    if (!term) {
      setItems(serverItems);
      return;
    }

    const filtered = serverItems.filter((u) => {
      const email = (u.email || '').toLowerCase();
      const first = (u.firstName || '').toLowerCase();
      const last = (u.lastName || '').toLowerCase();
      const full = `${first} ${last}`.trim();
      return (
        email.includes(term) || first.includes(term) || last.includes(term) || full.includes(term)
      );
    });
    setItems(filtered);
  }, [q, serverItems]);

  if (!isDirector) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-fg-muted text-sm">Access restricted</p>
      </div>
    );
  }

  const scheduleSearch = (next: string) => {
    // debounce ~300ms pour éviter de spam l’API.
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void load(next);
    }, 300);
  };

  const ban = async (id: string) => {
    setError(null);
    try {
      await apiFetch(`/users/${encodeURIComponent(id)}/ban`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'BANNED_BY_DIRECTOR' }),
      });
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'BANNED') {
        window.location.href = `/${locale}/banned`;
        return;
      }
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const unban = async (id: string) => {
    setError(null);
    try {
      await apiFetch(`/users/${encodeURIComponent(id)}/unban`, { method: 'PATCH' });
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'BANNED') {
        window.location.href = `/${locale}/banned`;
        return;
      }
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const del = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    setError(null);
    try {
      await apiFetch(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'BANNED') {
        window.location.href = `/${locale}/banned`;
        return;
      }
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white mb-1">{t('title')}</h1>
        <p className="text-fg-muted text-sm">{t('subtitle')}</p>
      </div>

      <div className="flex gap-2">
        <input
          className="border border-white/10 bg-black/30 text-white placeholder:text-fg-muted rounded-lg px-3 py-2 w-full outline-none focus:border-primary/60"
          placeholder={t('searchPlaceholder')}
          value={q}
          onInput={(e) => {
            const next = (e.target as HTMLInputElement).value;
            setQ(next);
            scheduleSearch(next);
          }}
        />
        <button
          className="border border-white/10 bg-surface-1 text-white rounded-lg px-3 py-2 hover:bg-white/5"
          onClick={() => void load()}
          disabled={isLoading}
        >
          {t('searchButton')}
        </button>
      </div>

      {error && (
        <div className="mt-4 text-red-300">
          {t('errorPrefix')} {error}
        </div>
      )}

      <div className="mt-4 text-sm text-fg-muted">{t('total', { count: items.length || 0 })}</div>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-surface-1">
            <tr>
              <th className="text-left p-3 text-fg-muted">{t('table.email')}</th>
              <th className="text-left p-3 text-fg-muted">{t('table.name')}</th>
              <th className="text-left p-3 text-fg-muted">{t('table.roles')}</th>
              <th className="text-left p-3 text-fg-muted">{t('table.status')}</th>
              <th className="text-right p-3 text-fg-muted">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="p-3 text-fg-muted" colSpan={5}>
                  {t('loading')}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="p-3 text-fg-muted" colSpan={5}>
                  {t('empty')}
                </td>
              </tr>
            ) : (
              items.map((u) => (
                <tr key={u.id} className="border-t border-white/5 text-white">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{(u.firstName || '') + ' ' + (u.lastName || '')}</td>
                  <td className="p-3">{(u.roles || []).join(', ')}</td>
                  <td className="p-3">
                    {u.isBanned ? t('statusValues.banned') : t('statusValues.active')}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {u.isBanned ? (
                      <button
                        className="border border-white/10 rounded-lg px-2 py-1 mr-2 hover:bg-white/5"
                        onClick={() => void unban(u.id)}
                      >
                        {t('actions.unban')}
                      </button>
                    ) : (
                      <button
                        className="border border-white/10 rounded-lg px-2 py-1 mr-2 hover:bg-white/5"
                        onClick={() => void ban(u.id)}
                      >
                        {t('actions.ban')}
                      </button>
                    )}
                    <button
                      className="border border-white/10 rounded-lg px-2 py-1 hover:bg-white/5"
                      onClick={() => void del(u.id)}
                    >
                      {t('actions.delete')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
