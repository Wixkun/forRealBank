'use client';

import { useEffect, type JSX } from 'react';
import { useTranslations } from 'next-intl';

export type NewsStatus =
  | 'SECURITY'
  | 'TRANSACTION'
  | 'PAYMENT'
  | 'ACCOUNT'
  | 'SYSTEM'
  | 'INFORMATION';

export interface NewsItem {
  id: string;
  authorId: string | null;
  userId: string | null;
  title: string;
  subtitle?: string | null;
  content: string;
  status: NewsStatus;
  createdAt: string;
  archivedAt: string | null;
  imageUrl?: string | null;
}

export type NewsStatusConfig = { label: string; bg: string; color: string; icon: JSX.Element };

// Le contenu stocke les images inline sous la forme `![image](url)`
const NEWS_IMAGE_REGEX = /!\[[^\]]*\]\(([^)\s]+)\)/g;

type ContentSegment = { type: 'text' | 'image'; value: string };

export function splitNewsContent(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  for (const match of content.matchAll(NEWS_IMAGE_REGEX)) {
    const text = content.slice(lastIndex, match.index).trim();
    if (text) segments.push({ type: 'text', value: text });
    segments.push({ type: 'image', value: match[1] });
    lastIndex = (match.index ?? 0) + match[0].length;
  }
  const tail = content.slice(lastIndex).trim();
  if (tail) segments.push({ type: 'text', value: tail });
  return segments;
}

export function stripNewsImages(content: string): string {
  return content.replace(NEWS_IMAGE_REGEX, '').replace(/\n{2,}/g, '\n').trim();
}

export function newsHasImage(item: Pick<NewsItem, 'content' | 'imageUrl'>): boolean {
  NEWS_IMAGE_REGEX.lastIndex = 0;
  return Boolean(item.imageUrl) || NEWS_IMAGE_REGEX.test(item.content);
}

type NewsDetailModalProps = {
  item: NewsItem | null;
  cfg: NewsStatusConfig | null;
  loading?: boolean;
  error?: string | null;
  onCloseAction: () => void;
};

export function NewsDetailModal({ item, cfg, loading, error, onCloseAction }: NewsDetailModalProps) {
  const t = useTranslations('feed.detail');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseAction();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCloseAction]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCloseAction}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#14161c] rounded-2xl border border-white/8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 px-5 py-4 bg-[#14161c]/95 backdrop-blur border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            {cfg && (
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                {cfg.icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-white text-sm font-semibold leading-snug truncate">
                {item?.title ?? (loading ? t('loading') : t('notFoundTitle'))}
              </h2>
              {item && (
                <p className="text-gray-500 text-[11px] mt-0.5">
                  {new Date(item.createdAt).toLocaleString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onCloseAction}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition shrink-0"
            aria-label={t('close')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4">
          {loading && <p className="text-gray-500 text-xs py-6 text-center">{t('loading')}</p>}

          {!loading && error && (
            <p className="text-red-300 text-xs py-6 text-center">{t('notFound')}</p>
          )}

          {!loading && !error && item && (
            <>
              {item.archivedAt && (
                <p className="mb-3 text-[11px] px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  {t('archived')}
                </p>
              )}
              {item.subtitle && (
                <p className="text-gray-300 text-sm font-medium mb-3">{item.subtitle}</p>
              )}
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="mb-3 max-w-full h-auto max-h-[60vh] object-contain rounded-xl border border-white/5 mx-auto"
                />
              )}
              <div className="space-y-3">
                {splitNewsContent(item.content).map((segment, i) =>
                  segment.type === 'text' ? (
                    <p key={i} className="text-gray-400 text-[13px] leading-relaxed whitespace-pre-wrap wrap-break-word">
                      {segment.value}
                    </p>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={segment.value}
                      alt=""
                      className="max-w-full h-auto max-h-[60vh] object-contain rounded-xl border border-white/5 mx-auto"
                    />
                  ),
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
