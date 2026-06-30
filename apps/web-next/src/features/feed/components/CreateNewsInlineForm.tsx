'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type NewsStatus =
  | 'SECURITY'
  | 'TRANSACTIONS'
  | 'PAYMENTS'
  | 'ACCOUNT_UPDATES'
  | 'SYSTEM'
  | 'INFORMATION';

const STATUS_OPTIONS: { value: NewsStatus; label: string; color: string; dot: string }[] = [
  { value: 'INFORMATION', label: 'Information', color: 'text-amber-400', dot: 'bg-amber-400' },
  { value: 'SECURITY', label: 'Sécurité', color: 'text-rose-400', dot: 'bg-rose-400' },
  { value: 'TRANSACTIONS', label: 'Transaction', color: 'text-cyan-400', dot: 'bg-cyan-400' },
  { value: 'PAYMENTS', label: 'Paiement', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  { value: 'ACCOUNT_UPDATES', label: 'Compte', color: 'text-blue-400', dot: 'bg-blue-400' },
  { value: 'SYSTEM', label: 'Système', color: 'text-violet-400', dot: 'bg-violet-400' },
];

type Props = {
  apiUrl?: string;
  onCreatedAction?: () => void;
};

export function CreateNewsInlineForm({ apiUrl = '/api', onCreatedAction }: Props) {
  const t = useTranslations('feed.create');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<NewsStatus>('INFORMATION');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`${apiUrl}/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, content, status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({ text: data.message || t('messages.createFailed'), ok: false });
        return;
      }

      setMessage({ text: t('messages.created'), ok: true });
      setTitle('');
      setContent('');
      setStatus('INFORMATION');
      onCreatedAction?.();
    } catch (err) {
      const text = err instanceof Error ? err.message : t('messages.unknownError');
      setMessage({ text, ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#1a1d24] rounded-xl border border-white/8 p-4">
      <h3 className="text-sm font-semibold text-white mb-3">{t('title')}</h3>

      {message && (
        <div
          className={`mb-3 text-xs px-3 py-2 rounded-lg border ${
            message.ok
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[11px] text-gray-500 mb-1.5">Type d&apos;actualité</label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                  status === opt.value
                    ? `${opt.color} border-current bg-white/5`
                    : 'text-gray-600 border-white/5 hover:text-gray-400 hover:border-white/10'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-gray-500 mb-1.5">{t('fields.title')}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/50"
            required
            maxLength={120}
            placeholder="Titre de l'actualité"
          />
        </div>

        <div>
          <label className="block text-[11px] text-gray-500 mb-1.5">{t('fields.content')}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/50 min-h-20 resize-none"
            required
            maxLength={2000}
            placeholder="Contenu du message..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !title || !content}
          className="px-4 py-2 rounded-lg bg-teal-500 text-gray-900 text-xs font-semibold hover:bg-teal-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t('submitLoading') : t('submit')}
        </button>
      </form>
    </div>
  );
}
