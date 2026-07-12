'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createBanRequest, type BanRequestAttachmentInput } from '@/features/users/api';
import type { UserDetails } from '@/features/users/types';
import { formatFileSize } from '@/lib/uploads/images';

// Mêmes règles que les pièces jointes de la messagerie (le backend revalide :
// MIME, taille, stockage en base via /chat/uploads).
const ACCEPTED_TYPES = /^(image\/(jpeg|png|gif|webp)|application\/pdf)$/;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 5;
const QUICK_EMOJIS = ['⚠️', '🚨', '❗', '😡', '🧾', '💳', '🔒', '📎'];

/**
 * « Demander le bannissement » (advisor, pour l'un de SES clients) : motif
 * obligatoire (le texte est conservé tel quel), emojis, pièces jointes images
 * et PDF. La demande est attribuée côté serveur au director le moins chargé
 * et envoyée dans leur conversation privée.
 */
export function RequestBanModal({ client, onDone }: { client: UserDetails; onDone: () => void }) {
  const t = useTranslations('users.requestBan');
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setReason((r) => r + emoji);
      return;
    }
    const start = el.selectionStart ?? reason.length;
    const end = el.selectionEnd ?? reason.length;
    const next = reason.slice(0, start) + emoji + reason.slice(end);
    setReason(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
    });
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setError(null);
    const next = [...files];
    for (const file of Array.from(list)) {
      if (!ACCEPTED_TYPES.test(file.type)) {
        setError(t('errors.invalidType'));
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError(t('errors.tooLarge'));
        continue;
      }
      if (next.length >= MAX_FILES) {
        setError(t('errors.tooMany', { count: MAX_FILES }));
        break;
      }
      next.push(file);
    }
    setFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t('errors.reasonRequired'));
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Upload des pièces via le stockage validé de la messagerie.
      let attachments: BanRequestAttachmentInput[] = [];
      if (files.length > 0) {
        const form = new FormData();
        for (const file of files) form.append('files', file);
        const res = await fetch('/api/chat/uploads', {
          method: 'POST',
          credentials: 'include',
          body: form,
        });
        if (!res.ok) throw new Error(`upload HTTP ${res.status}`);
        attachments = (await res.json()) as BanRequestAttachmentInput[];
      }
      // 2. Création de la demande (motif conservé tel quel).
      await createBanRequest({ clientId: client.id, reason, attachments });
      onDone();
    } catch {
      setError(t('errors.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-5 py-4 space-y-4">
      <p className="text-sm text-fg-muted">
        {t('subtitle', { name: `${client.firstName} ${client.lastName}` })}
      </p>

      <div>
        <label className="block text-fg-muted text-xs mb-1.5" htmlFor="ban-reason">
          {t('reasonLabel')}
        </label>
        <textarea
          id="ban-reason"
          ref={textareaRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder={t('reasonPlaceholder')}
          className="w-full resize-y rounded-lg border border-edge-strong bg-input px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary/60"
        />
        <div className="mt-1.5 flex flex-wrap gap-1" role="group" aria-label={t('emojis')}>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertEmoji(emoji)}
              className="rounded-lg px-2 py-1 text-base hover:bg-hover-strong transition"
              aria-label={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
          id="ban-attachments"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-edge-strong bg-hover px-3 py-2 text-xs font-semibold text-fg-secondary hover:bg-hover-strong transition"
        >
          {t('attach')}
        </button>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-edge bg-input px-3 py-1.5 text-xs text-fg-secondary"
              >
                <span className="truncate">
                  {file.name} · {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => setFiles((f) => f.filter((_, i) => i !== index))}
                  className="shrink-0 text-fg-muted hover:text-fg"
                  aria-label={t('removeFile')}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={isSubmitting || !reason.trim()}
        className="w-full rounded-lg bg-red-500/80 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-500 transition disabled:opacity-50"
      >
        {isSubmitting ? t('sending') : t('send')}
      </button>
    </div>
  );
}
