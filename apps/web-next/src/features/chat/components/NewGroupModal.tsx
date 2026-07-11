'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from 'next-intl';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
}

interface NewGroupModalProps {
  open: boolean;
  candidates: Candidate[];
  onClose: () => void;
  onCreate: (name: string, participantIds: string[]) => Promise<void>;
}

export default function NewGroupModal({ open, candidates, onClose, onCreate }: NewGroupModalProps) {
  const { theme } = useTheme();
  const t = useTranslations('chat.group');
  const isDark = theme === 'dark';

  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Réinitialise et pose le focus à l'ouverture.
  useEffect(() => {
    if (open) {
      setName('');
      setSearch('');
      setSelected([]);
      setError(null);
      const id = window.setTimeout(() => nameInputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  // Fermeture au clavier (Escape).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const candidateById = useMemo(() => new Map(candidates.map((c) => [c.id, c])), [candidates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter(
      (c) =>
        !selected.includes(c.id) &&
        (!q || `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)),
    );
  }, [candidates, search, selected]);

  if (!open) return null;

  const canSubmit = name.trim().length > 0 && selected.length >= 2 && !submitting;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('nameRequired'));
      return;
    }
    if (selected.length < 2) {
      setError(t('minParticipants'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(name.trim(), selected);
    } catch {
      setError(t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-xl border p-5 shadow-xl ${
          isDark
            ? 'bg-surface-1 border-white/10 text-white'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        <h2 className="mb-4 text-lg font-semibold">{t('title')}</h2>

        <label className="mb-1 block text-sm font-medium" htmlFor="group-name">
          {t('nameLabel')}
        </label>
        <input
          id="group-name"
          ref={nameInputRef}
          type="text"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          className={`mb-4 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
            isDark ? 'border-white/10 bg-surface-2 text-white' : 'border-gray-300 bg-white'
          }`}
        />

        <p className="mb-1 text-sm font-medium">{t('participantsLabel')}</p>
        {selected.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selected.map((id) => {
              const c = candidateById.get(id);
              if (!c) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-xs text-primary"
                >
                  {c.firstName} {c.lastName}
                  <button
                    type="button"
                    aria-label={`${t('remove')} ${c.firstName} ${c.lastName}`}
                    onClick={() => setSelected((prev) => prev.filter((x) => x !== id))}
                    className="ml-1 rounded-full px-1 hover:bg-primary/25"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className={`mb-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
            isDark ? 'border-white/10 bg-surface-2 text-white' : 'border-gray-300 bg-white'
          }`}
        />
        <div className="mb-4 max-h-40 overflow-y-auto scrollbar-slim rounded-lg border border-white/5">
          {filtered.length === 0 ? (
            <p className={`p-3 text-sm ${isDark ? 'text-fg-muted' : 'text-gray-500'}`}>—</p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected((prev) => [...prev, c.id])}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                }`}
              >
                {c.firstName} {c.lastName}
              </button>
            ))
          )}
        </div>

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
              isDark
                ? 'bg-white/5 text-fg-secondary hover:bg-white/10'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {submitting ? t('creating') : t('submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
