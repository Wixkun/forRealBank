'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { acceptBanRequest, rejectBanRequest } from '@/features/users/api';
import type { BanRequestCard } from '@/features/users/types';
import type { ChatAttachment } from '@/features/chat/attachments';

/**
 * Carte structurée d'une demande de bannissement dans la conversation.
 * Les boutons Accepter / Refuser ne sont rendus (et acceptés côté serveur)
 * que pour le director ASSIGNÉ tant que la demande est PENDING. Les pièces
 * jointes restent consultables après la décision. Toute action s'appuie sur
 * l'identifiant de la demande, jamais sur le texte du message.
 */
export function BanRequestMessageCard({
  request,
  attachments,
  renderAttachment,
  isDark,
  onDecided,
}: {
  request: BanRequestCard;
  attachments: ChatAttachment[];
  renderAttachment: (attachment: ChatAttachment, index: number) => React.ReactNode;
  isDark: boolean;
  onDecided: () => void;
}) {
  const t = useTranslations('chat.banRequest');
  const locale = useLocale();
  const [isRejecting, setIsRejecting] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const decide = async (accept: boolean) => {
    setIsSubmitting(true);
    setError(false);
    try {
      if (accept) await acceptBanRequest(request.id);
      else await rejectBanRequest(request.id, comment.trim() || undefined);
      setIsRejecting(false);
      onDecided();
    } catch {
      setError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusStyles: Record<BanRequestCard['status'], string> = {
    PENDING: 'bg-amber-500/15 text-warning',
    ACCEPTED: 'bg-red-500/15 text-danger',
    REJECTED: 'bg-hover-strong text-fg-muted',
  };

  return (
    <div
      className={`max-w-sm rounded-lg border p-4 space-y-3 ${
        isDark ? 'border-red-400/30 bg-surface-2' : 'border-red-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`text-sm font-semibold ${isDark ? 'text-fg' : 'text-gray-900'}`}>
          {t('title')}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyles[request.status]}`}
        >
          {t(`status.${request.status}`)}
        </span>
      </div>

      <div className={`space-y-1 text-xs ${isDark ? 'text-fg-secondary' : 'text-gray-700'}`}>
        <p>
          <span className={isDark ? 'text-fg-muted' : 'text-gray-500'}>{t('client')}</span>{' '}
          {request.clientName}
        </p>
        <p>
          <span className={isDark ? 'text-fg-muted' : 'text-gray-500'}>{t('advisor')}</span>{' '}
          {request.advisorName}
        </p>
        {request.createdAt && (
          <p>
            <span className={isDark ? 'text-fg-muted' : 'text-gray-500'}>{t('date')}</span>{' '}
            {new Date(request.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
          </p>
        )}
      </div>

      <p
        className={`whitespace-pre-wrap wrap-break-word rounded-lg border px-3 py-2 text-sm ${
          isDark
            ? 'border-edge-strong bg-input text-fg'
            : 'border-gray-200 bg-gray-50 text-gray-900'
        }`}
      >
        {request.reason}
      </p>

      {attachments.length > 0 && (
        <div className="space-y-2">{attachments.map((a, i) => renderAttachment(a, i))}</div>
      )}

      {request.status !== 'PENDING' && (
        <div className={`text-xs ${isDark ? 'text-fg-muted' : 'text-gray-500'}`}>
          {request.processedAt && (
            <p>
              {t('processedAt', {
                date: new Date(request.processedAt).toLocaleDateString(
                  locale === 'fr' ? 'fr-FR' : 'en-US',
                ),
              })}
            </p>
          )}
          {request.decisionComment && <p>{t('comment', { comment: request.decisionComment })}</p>}
        </div>
      )}

      {error && <p className="text-xs text-danger">{t('error')}</p>}

      {request.canDecide && !isRejecting && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void decide(true)}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-red-500/80 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500 transition disabled:opacity-50"
          >
            {t('accept')}
          </button>
          <button
            type="button"
            onClick={() => setIsRejecting(true)}
            disabled={isSubmitting}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
              isDark
                ? 'border-edge-strong bg-hover text-fg-secondary hover:bg-hover-strong'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('reject')}
          </button>
        </div>
      )}

      {request.canDecide && isRejecting && (
        <div className="space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder={t('commentPlaceholder')}
            className={`w-full resize-y rounded-lg border px-3 py-2 text-sm focus:outline-none ${
              isDark
                ? 'border-edge-strong bg-input text-fg placeholder:text-fg-subtle focus:border-primary/60'
                : 'border-gray-300 bg-white text-gray-900 focus:border-teal-500'
            }`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void decide(false)}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition disabled:opacity-50"
            >
              {t('confirmReject')}
            </button>
            <button
              type="button"
              onClick={() => setIsRejecting(false)}
              disabled={isSubmitting}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                isDark
                  ? 'border-edge-strong bg-hover text-fg-secondary hover:bg-hover-strong'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
