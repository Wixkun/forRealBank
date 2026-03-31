'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSSE } from '@/hooks/useSSE';
import { CreateNewsInlineForm } from '@/components/feed/CreateNewsInlineForm';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/contexts/ThemeContext';

interface NewsItem {
  id: string;
  authorId: string | null;
  title: string;
  content: string;
  createdAt: string;
}

interface NewsFeedProps {
  apiUrl?: string;
  userRoles?: string[] | null;
}

export default function NewsFeed({
  apiUrl = '/api/proxy',
  userRoles = null,
}: NewsFeedProps) {
  const t = useTranslations('feed');
  const locale = useLocale();
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  const [news, setNews] = useState<NewsItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const canPublish = useMemo(() => {
    if (!userRoles || !Array.isArray(userRoles)) return false;
    return userRoles.includes('ADVISOR') || userRoles.includes('DIRECTOR');
  }, [userRoles]);

  type NewsSSEPayload = NewsItem[] | { data: NewsItem[] };

  const { isConnected } = useSSE<NewsSSEPayload>({
    url: `${apiUrl}/news/stream`,
    onMessage: (payload) => {
      const arr = Array.isArray(payload)
        ? payload
        : ((payload as { data?: NewsItem[] })?.data ?? []);
      setNews(arr as NewsItem[]);
    },
    withCredentials: true,
  });

  useEffect(() => {
    const loadNews = async () => {
      try {
        const res = await fetch(`${apiUrl}/news`, { credentials: 'include' });
        const data = await res.json();
        setNews(data);
      } catch (err) {
        console.error('Failed to load news:', err);
      }
    };
    loadNews();
  }, [apiUrl]);

  const handleDelete = async (id: string) => {
    if (!canPublish) return;
    const ok = typeof window !== 'undefined' ? window.confirm(t('confirmDelete')) : false;
    if (!ok) return;

    try {
      setDeletingId(id);
      const res = await fetch(`${apiUrl}/news/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        console.error('Failed to delete news:', await res.text().catch(() => ''));
        return;
      }

      setNews((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete news:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  const saveEdit = async (id: string) => {
    if (!canPublish) return;

    try {
      setSavingId(id);
      const res = await fetch(`${apiUrl}/news/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });

      if (!res.ok) {
        console.error('Failed to update news:', await res.text().catch(() => ''));
        return;
      }

      setNews((prev) =>
        prev.map((n) => (n.id === id ? { ...n, title: editTitle, content: editContent } : n)),
      );
      cancelEdit();
    } catch (err) {
      console.error('Failed to update news:', err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div
      className={`w-full max-w-4xl mx-auto p-4 ${
        currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'
      }`}
    >
      <div className="flex items-center justify-between mb-6 gap-4">
        <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {t('title')}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              title={isConnected ? t('connection.connected') : t('connection.disconnected')}
            />
            <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {isConnected ? t('connection.realtime') : t('connection.offline')}
            </span>
          </div>
        </div>
      </div>

      {canPublish && (
        <div className="mb-6">
          <CreateNewsInlineForm
            apiUrl={apiUrl}
            onCreatedAction={() => {
              if (!isConnected) {
                fetch(`${apiUrl}/news`)
                  .then((r) => r.json())
                  .then((data) => setNews(data))
                  .catch(() => undefined);
              }
            }}
          />
        </div>
      )}

      <div className="space-y-4">
        {news.length === 0 && (
          <div className={`text-center py-12 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('empty')}
          </div>
        )}
        {news.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border ${
              currentTheme === 'dark'
                ? 'bg-gray-900/40 border-gray-700/50'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {editingId === item.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        {t('edit.titleLabel')}
                      </label>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          currentTheme === 'dark'
                            ? 'bg-gray-950/60 border-gray-700 text-gray-100 placeholder:text-gray-500'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        maxLength={120}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        {t('edit.contentLabel')}
                      </label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className={`w-full border rounded px-3 py-2 min-h-30 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          currentTheme === 'dark'
                            ? 'bg-gray-950/60 border-gray-700 text-gray-100 placeholder:text-gray-500'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        maxLength={2000}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(item.id)}
                        disabled={savingId === item.id}
                        className="px-3 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                      >
                        {savingId === item.id ? t('edit.saving') : t('edit.save')}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={savingId === item.id}
                        className={`px-3 py-2 rounded border hover:bg-gray-50 disabled:opacity-50 ${
                          currentTheme === 'dark'
                            ? 'border-gray-700 bg-gray-950/40 hover:bg-gray-800/60 text-gray-100'
                            : 'border-gray-200 bg-white text-gray-800'
                        }`}
                      >
                        {t('edit.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className={`text-xl font-semibold mb-2 ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {item.title}
                    </h3>
                    <p className={`${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-4`}>
                      {item.content}
                    </p>
                    <div className={`flex items-center gap-4 text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span>
                        📅{' '}
                        {new Date(item.createdAt).toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span>
                        🕐{' '}
                        {new Date(item.createdAt).toLocaleTimeString(locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {canPublish && editingId !== item.id && (
                <div className="shrink-0 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className={`px-3 py-2 rounded border hover:bg-gray-50 ${
                      currentTheme === 'dark'
                        ? 'border-gray-700 text-gray-100 hover:bg-gray-800/60'
                        : 'border-gray-200 text-gray-800'
                    }`}
                  >
                    {t('actions.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className={`px-3 py-2 rounded border disabled:opacity-50 ${
                      currentTheme === 'dark'
                        ? 'border-red-900/60 text-red-300 hover:bg-red-950/40'
                        : 'border-red-200 text-red-700 hover:bg-red-50'
                    }`}
                  >
                    {deletingId === item.id ? t('actions.deleting') : t('actions.delete')}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
