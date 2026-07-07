'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useSSE } from '@/hooks/useSSE';
import { CreateNewsInlineForm } from '@/features/feed/components/CreateNewsInlineForm';
import {
  NewsDetailModal,
  NEWS_STATUS_CONFIG as STATUS_CONFIG,
  stripNewsImages,
  newsHasImage,
  type NewsItem,
} from '@/features/feed/components/NewsDetailModal';

interface NewsFeedProps {
  apiUrl?: string;
  userRoles?: string[] | null;
  userId?: string | null;
}

const DRAG_THRESHOLD = 75;

const CLICK_THRESHOLD = 6;

interface DraggableNewsItemProps {
  item: NewsItem;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: (item: NewsItem) => void;
  isNew?: boolean;
}

function DraggableNewsItem({ item, onArchive, onDelete, onOpen, isNew }: DraggableNewsItemProps) {
  const t = useTranslations('feed.list');
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exiting, setExiting] = useState(false);
  const startXRef = useRef(0);
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.INFORMATION;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return t('justNow');
    if (m < 60) return t('minutesAgo', { count: m });
    const h = Math.floor(m / 60);
    if (h < 24) return t('hoursAgo', { count: h });
    return t('daysAgo', { count: Math.floor(h / 24) });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setTranslateX(e.clientX - startXRef.current);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (translateX > DRAG_THRESHOLD) {
      setExiting(true);
      setTimeout(() => onDelete(item.id), 260);
    } else if (translateX < -DRAG_THRESHOLD) {
      setExiting(true);
      setTimeout(() => onArchive(item.id), 260);
    } else {
      if (Math.abs(translateX) < CLICK_THRESHOLD) onOpen(item);
      setTranslateX(0);
    }
  };

  const progress = Math.min(Math.abs(translateX) / DRAG_THRESHOLD, 1);
  const isRight = translateX > 10;
  const isLeft = translateX < -10;

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scaleY(0.8)' : 'scaleY(1)',
        transition: exiting ? 'opacity 260ms ease, transform 260ms ease' : undefined,
      }}
    >
      <div
        className="absolute inset-0 rounded-xl flex items-center justify-start pl-4 gap-2"
        style={{ opacity: isRight ? progress : 0, background: `rgba(239,68,68,${0.15 * progress})` }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
        <span className="text-red-400 text-xs font-semibold">{t('delete')}</span>
      </div>

      <div
        className="absolute inset-0 rounded-xl flex items-center justify-end pr-4 gap-2"
        style={{ opacity: isLeft ? progress : 0, background: `rgba(34,197,94,${0.15 * progress})` }}
      >
        <span className="text-green-400 text-xs font-semibold">{t('archive')}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" />
        </svg>
      </div>

      <div
        className="relative flex items-start gap-3 p-3.5 bg-[#1a1d24] rounded-xl border border-white/4 cursor-pointer select-none hover:border-white/10 transition-colors"
        style={{ transform: `translateX(${translateX}px)`, transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.25,0.46,0.45,0.94)' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-white text-xs font-semibold leading-snug truncate">{item.title}</span>
            <span className="text-gray-600 text-[10px] whitespace-nowrap shrink-0 mt-0.5">{timeAgo(item.createdAt)}</span>
          </div>
          <p className="text-gray-400 text-[11px] mt-0.5 line-clamp-1 leading-relaxed pr-1">
            {item.subtitle || stripNewsImages(item.content)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-1.5">
          {newsHasImage(item) && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
          {isNew && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

const HIDDEN_NEWS_KEY = 'forreal_hidden_news';

function loadHiddenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_NEWS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveHiddenIds(ids: Set<string>) {
  try {
    localStorage.setItem(HIDDEN_NEWS_KEY, JSON.stringify([...ids]));
  } catch {}
}

export default function NewsFeed({ apiUrl = '/api', userRoles = null, userId = null }: NewsFeedProps) {
  const t = useTranslations('feed.list');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [archived, setArchived] = useState<NewsItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<{ item: NewsItem | null; loading: boolean; error: string | null } | null>(null);
  const removedIdsRef = useRef<Set<string>>(new Set());

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const newsIdParam = searchParams.get('newsId');

  const openNews = useCallback((item: NewsItem) => {
    setDetail({ item, loading: false, error: null });
  }, []);

  const closeDetail = useCallback(() => {
    setDetail(null);
    // Nettoie le deep-link (?newsId=...) posé par une notification
    if (newsIdParam) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('newsId');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [newsIdParam, searchParams, router, pathname]);

  // Notification cliquée → /dashboard?newsId=<id> : on charge la news depuis
  // l'API (elle peut ne pas être dans le fil) et on ouvre la popup de détail.
  useEffect(() => {
    if (!newsIdParam) return;
    let cancelled = false;
    setDetail({ item: null, loading: true, error: null });
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/news/${newsIdParam}`, { credentials: 'include' });
        if (cancelled) return;
        if (!res.ok) {
          setDetail({ item: null, loading: false, error: 'NOT_FOUND' });
          return;
        }
        const data: NewsItem = await res.json();
        setDetail({ item: data, loading: false, error: null });
      } catch {
        if (!cancelled) setDetail({ item: null, loading: false, error: 'NOT_FOUND' });
      }
    })();
    return () => { cancelled = true; };
  }, [newsIdParam, apiUrl]);

  useEffect(() => {
    if (!userId) {
      removedIdsRef.current = loadHiddenIds();
    }
  }, [userId]);

  const canPublish =
    Array.isArray(userRoles) && (userRoles.includes('ADVISOR') || userRoles.includes('DIRECTOR'));

  type NewsSSEPayload = NewsItem[] | { data: NewsItem[] };

  useSSE<NewsSSEPayload>({
    url: `${apiUrl}/news/stream`,
    onMessage: (payload) => {
      const arr = Array.isArray(payload) ? payload : (payload as { data?: NewsItem[] })?.data;
      // Ignore les émissions unitaires (création d'une news) : le poll SSE
      // suivant renvoie la liste complète filtrée par utilisateur.
      if (!Array.isArray(arr)) return;
      const filtered = arr.filter((n) => !removedIdsRef.current.has(n.id) && !n.archivedAt);
      setNews(filtered);
    },
    withCredentials: true,
  });

  const loadNews = useCallback(async () => {
    try {
      const [activeRes, archiveRes] = await Promise.all([
        fetch(`${apiUrl}/news`, { credentials: 'include' }),
        fetch(`${apiUrl}/news?archivedOnly=true`, { credentials: 'include' }),
      ]);
      const activeJson = await activeRes.json();
      const archiveJson = await archiveRes.json();
      const activeData: NewsItem[] = Array.isArray(activeJson) ? activeJson : [];
      const archiveData: NewsItem[] = Array.isArray(archiveJson) ? archiveJson : [];
      setNews(activeData.filter((n) => !removedIdsRef.current.has(n.id)));
      setArchived(archiveData.filter((n) => !removedIdsRef.current.has(n.id)));
    } catch (err) {
      console.error('Failed to load news:', err);
    }
  }, [apiUrl]);

  useEffect(() => { loadNews(); }, [loadNews]);

  useEffect(() => {
    if (news.length > 0 && seenIds.size === 0) {
      setSeenIds(new Set(news.map((n) => n.id)));
    }
  }, [news, seenIds.size]);

  const handleArchive = async (id: string) => {
    removedIdsRef.current.add(id);
    const item = news.find((n) => n.id === id);
    setNews((prev) => prev.filter((n) => n.id !== id));
    if (item) {
      setArchived((prev) => {
        if (prev.some((n) => n.id === id)) return prev;
        return [{ ...item, archivedAt: new Date().toISOString() }, ...prev];
      });
    }
    try {
      await fetch(`${apiUrl}/news/${id}/archive`, { method: 'POST', credentials: 'include' });
      removedIdsRef.current.delete(id);
    } catch {
      removedIdsRef.current.delete(id);
      loadNews();
    }
  };

  const handleDelete = async (id: string) => {
    removedIdsRef.current.add(id);
    setNews((prev) => prev.filter((n) => n.id !== id));
    setArchived((prev) => prev.filter((n) => n.id !== id));
    if (userId) {
      try {
        await fetch(`${apiUrl}/news/${id}/dismiss`, { method: 'POST', credentials: 'include' });
      } catch {
        removedIdsRef.current.delete(id);
        loadNews();
      }
    } else {
      saveHiddenIds(removedIdsRef.current);
    }
  };

  const handleUnarchive = async (id: string) => {
    removedIdsRef.current.delete(id);
    const item = archived.find((n) => n.id === id);
    setArchived((prev) => prev.filter((n) => n.id !== id));
    if (item) {
      const unarchived = { ...item, archivedAt: null };
      setNews((prev) => {
        if (prev.some((n) => n.id === id)) return prev;
        return [unarchived, ...prev];
      });
    }
    try {
      await fetch(`${apiUrl}/news/${id}/unarchive`, { method: 'POST', credentials: 'include' });
    } catch {
      removedIdsRef.current.add(id);
      loadNews();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelection = () => { setSelectionMode(false); setSelectedIds(new Set()); };
  const handleBulkDelete = async () => { const ids = [...selectedIds]; exitSelection(); await Promise.all(ids.map((id) => handleDelete(id))); };
  const handleBulkArchive = async () => { const ids = [...selectedIds]; exitSelection(); await Promise.all(ids.map((id) => handleArchive(id))); };
  const handleBulkUnarchive = async () => { const ids = [...selectedIds]; exitSelection(); await Promise.all(ids.map((id) => handleUnarchive(id))); };

  const displayedNews = showArchived ? archived : news;

  return (
    <div className="p-5">
      {canPublish && !showArchived && (
        <div className="mb-5 pb-5 border-b border-white/5">
          <CreateNewsInlineForm apiUrl={apiUrl} onCreatedAction={loadNews} />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <h3 className="font-semibold text-white text-sm">{showArchived ? t('archivedTitle') : t('title')}</h3>
          {!showArchived && news.length > 0 && (
            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full font-bold leading-none">{news.length}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!selectionMode && (
            <button onClick={() => setShowArchived((v) => !v)} className="text-gray-500 hover:text-gray-300 text-[11px] transition-colors">
              {showArchived ? t('back') : t('archivedCount', { count: archived.length })}
            </button>
          )}
          {displayedNews.length > 0 && (
            <button
              onClick={() => (selectionMode ? exitSelection() : setSelectionMode(true))}
              className={`text-[11px] transition ${selectionMode ? 'text-gray-500 hover:text-gray-300' : 'text-cyan-400 hover:text-cyan-300'}`}
            >
              {selectionMode ? t('cancel') : t('select')}
            </button>
          )}
        </div>
      </div>

      {!showArchived && !selectionMode && news.length > 0 && (
        <p className="text-gray-700 text-[10px] mb-2.5 flex items-center gap-1.5">
          <span className="text-green-700">←</span> {t('hintArchive')}
          <span className="mx-1 text-gray-800">·</span>
          {t('hintDelete')} <span className="text-red-800">→</span>
        </p>
      )}

      <div className="space-y-2">
        {displayedNews.length === 0 ? (
          <div className="py-8 text-center text-gray-600 text-xs">
            {showArchived ? t('emptyArchived') : t('empty')}
          </div>
        ) : showArchived ? (
          archived.map((item) => {
            const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.INFORMATION;
            const selected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => (selectionMode ? toggleSelect(item.id) : openNews(item))}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${selected ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-[#1a1d24]/50 border-white/4 hover:border-white/10'}`}
              >
                {selectionMode && (
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-cyan-400 bg-cyan-400' : 'border-gray-600'}`}>
                    {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                )}
                <div className={`rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} ${selectionMode ? 'w-7 h-7' : 'w-8 h-8'}`}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-xs font-medium truncate">{item.title}</p>
                  <p className="text-gray-600 text-[11px] mt-0.5 line-clamp-1">{item.subtitle || stripNewsImages(item.content)}</p>
                </div>
                {!selectionMode && (
                  <button onClick={(e) => { e.stopPropagation(); handleUnarchive(item.id); }} title={t('unarchive')} className="text-gray-700 hover:text-cyan-400 text-[10px] transition shrink-0 mt-0.5">↩</button>
                )}
              </div>
            );
          })
        ) : (
          news.map((item) => {
            const selected = selectedIds.has(item.id);
            if (selectionMode) {
              const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.INFORMATION;
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors select-none ${selected ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-[#1a1d24] border-white/4'}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${selected ? 'border-cyan-400 bg-cyan-400' : 'border-gray-600'}`}>
                    {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold leading-snug truncate">{item.title}</p>
                    <p className="text-gray-400 text-[11px] mt-0.5 line-clamp-1 leading-relaxed">{item.subtitle || stripNewsImages(item.content)}</p>
                  </div>
                </div>
              );
            }
            return (
              <DraggableNewsItem key={item.id} item={item} onArchive={handleArchive} onDelete={handleDelete} onOpen={openNews} isNew={!seenIds.has(item.id)} />
            );
          })
        )}
      </div>

      {selectionMode && selectedIds.size > 0 && (
        <div className="mt-3 p-3 bg-[#1a1d24] rounded-xl border border-white/8 flex items-center justify-between gap-2">
          <span className="text-gray-400 text-[11px]">{t('selected', { count: selectedIds.size })}</span>
          <div className="flex items-center gap-2">
            {showArchived ? (
              <button onClick={handleBulkUnarchive} className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 transition">{t('unarchive')}</button>
            ) : (
              <button onClick={handleBulkArchive} className="text-[11px] px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition">{t('archive')}</button>
            )}
            <button onClick={handleBulkDelete} className="text-[11px] px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition">{t('delete')}</button>
          </div>
        </div>
      )}

      {detail && (
        <NewsDetailModal
          item={detail.item}
          cfg={detail.item ? (STATUS_CONFIG[detail.item.status] ?? STATUS_CONFIG.INFORMATION) : null}
          loading={detail.loading}
          error={detail.error}
          onCloseAction={closeDetail}
        />
      )}
    </div>
  );
}
