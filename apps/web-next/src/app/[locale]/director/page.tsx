'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/contexts/ThemeContext';

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

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function apiFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiUrl}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export default function DirectorPage() {
  const pathname = usePathname();
  const locale = useMemo(() => pathname.split('/')[1] || 'en', [pathname]);

  const t = useTranslations('director');
  const { theme, mounted } = useTheme();

  const [q, setQ] = useState('');
  const [items, setItems] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      const qs = params.toString();
      const res = await apiFetch<UsersListResponse>(`/users${qs ? `?${qs}` : ''}`);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-400">{t('loading')}</div>
        </div>
      </div>
    );
  }

  const ban = async (id: string) => {
    setError(null);
    try {
      await apiFetch(`/users/${encodeURIComponent(id)}/ban`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'BANNED_BY_DIRECTOR' }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const unban = async (id: string) => {
    setError(null);
    try {
      await apiFetch(`/users/${encodeURIComponent(id)}/unban`, { method: 'PATCH' });
      await load();
    } catch (e) {
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
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors ${
        theme === 'dark'
          ? 'bg-linear-to-br from-gray-900 via-gray-800 to-slate-900 text-white'
          : 'bg-linear-to-br from-gray-50 via-blue-50 to-cyan-50 text-gray-900'
      }`}
    >
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">{t('title')}</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('subtitle')}
            </p>
          </div>

          <a className="underline text-sm" href={`/${locale}/chat/manage`}>
            Chat manage
          </a>
        </div>

        <div className="mt-6 flex gap-2">
          <input
            className={`border rounded px-3 py-2 w-full outline-none ${
              theme === 'dark'
                ? 'bg-gray-900/40 border-gray-700 text-white placeholder:text-gray-400'
                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-500'
            }`}
            placeholder={t('searchPlaceholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className={`border rounded px-3 py-2 ${
              theme === 'dark'
                ? 'border-gray-700 bg-gray-900/40 hover:bg-gray-900/60'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
            onClick={() => void load()}
            disabled={isLoading}
          >
            {t('searchButton')}
          </button>
        </div>

        {error && (
          <div className={`mt-4 ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>
            {t('errorPrefix')} {error}
          </div>
        )}

        <div className={`mt-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {t('total', { count: total })}
        </div>

        <div
          className={`mt-3 overflow-x-auto border rounded ${
            theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          <table className="w-full text-sm">
            <thead className={theme === 'dark' ? 'bg-gray-900/30' : 'bg-gray-50'}>
              <tr>
                <th className="text-left p-3">{t('table.email')}</th>
                <th className="text-left p-3">{t('table.name')}</th>
                <th className="text-left p-3">{t('table.roles')}</th>
                <th className="text-left p-3">{t('table.status')}</th>
                <th className="text-right p-3">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="p-3" colSpan={5}>
                    {t('loading')}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="p-3" colSpan={5}>
                    {t('empty')}
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr
                    key={u.id}
                    className={theme === 'dark' ? 'border-t border-gray-800' : 'border-t border-gray-200'}
                  >
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{(u.firstName || '') + ' ' + (u.lastName || '')}</td>
                    <td className="p-3">{(u.roles || []).join(', ')}</td>
                    <td className="p-3">
                      {u.isBanned ? t('statusValues.banned') : t('statusValues.active')}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {u.isBanned ? (
                        <button
                          className={`border rounded px-2 py-1 mr-2 ${
                            theme === 'dark'
                              ? 'border-gray-700 hover:bg-gray-900/50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => void unban(u.id)}
                        >
                          {t('actions.unban')}
                        </button>
                      ) : (
                        <button
                          className={`border rounded px-2 py-1 mr-2 ${
                            theme === 'dark'
                              ? 'border-gray-700 hover:bg-gray-900/50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => void ban(u.id)}
                        >
                          {t('actions.ban')}
                        </button>
                      )}
                      <button
                        className={`border rounded px-2 py-1 ${
                          theme === 'dark'
                            ? 'border-gray-700 hover:bg-gray-900/50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
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
    </div>
  );
}
