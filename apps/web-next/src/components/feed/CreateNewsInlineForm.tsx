'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  apiUrl?: string;
  onCreatedAction?: () => void;
};

export function CreateNewsInlineForm({ apiUrl = '/api/proxy', onCreatedAction }: Props) {
  const t = useTranslations('feed.create');
  const { theme, mounted } = useTheme();
  const currentTheme = mounted ? theme : 'dark';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`${apiUrl}/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.message || t('messages.createFailed'));
        return;
      }

      setMessage(t('messages.created'));
      setTitle('');
      setContent('');
      onCreatedAction?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('messages.unknownError');
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-lg shadow-md p-4 border ${
        currentTheme === 'dark' ? 'bg-gray-900/40 border-gray-700/50' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className={`text-lg font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {t('title')}
        </h3>
      </div>

      {message && (
        <div
          className={`mb-3 text-sm p-3 rounded border ${
            currentTheme === 'dark'
              ? 'bg-gray-950/40 border-gray-700 text-gray-100'
              : 'bg-white border-gray-200 text-gray-800'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
            {t('fields.title')}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              currentTheme === 'dark'
                ? 'bg-gray-950/60 border-gray-700 text-gray-100 placeholder:text-gray-500'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            required
            maxLength={120}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
            {t('fields.content')}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full border rounded px-3 py-2 min-h-30 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              currentTheme === 'dark'
                ? 'bg-gray-950/60 border-gray-700 text-gray-100 placeholder:text-gray-500'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            required
            maxLength={2000}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {submitting ? t('submitLoading') : t('submit')}
        </button>
      </form>
    </div>
  );
}
