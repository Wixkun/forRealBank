'use client';

import { useState, useEffect, useRef, useCallback, type JSX } from 'react';
import { useSSE } from '@/hooks/useSSE';
import { CreateNewsInlineForm } from '@/features/feed/components/CreateNewsInlineForm';

type NewsStatus =
  | 'SECURITY'
  | 'TRANSACTION'
  | 'PAYMENT'
  | 'ACCOUNT'
  | 'SYSTEM'
  | 'INFORMATION';

interface NewsItem {
  id: string;
  authorId: string | null;
  userId: string | null;
  title: string;
  content: string;
  status: NewsStatus;
  createdAt: string;
  archivedAt: string | null;
  imageUrl?: string | null;
}

interface NewsFeedProps {
  apiUrl?: string;
  userRoles?: string[] | null;
  userId?: string | null;
}

const STATUS_CONFIG: Record<
  NewsStatus,
  { label: string; bg: string; color: string; icon: JSX.Element }
> = {
  SECURITY: {
    label: 'Security',
    bg: 'bg-rose-500/15',
    color: '#f43f5e',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <circle cx="12" cy="16" r="1" fill="#f43f5e" />
      </svg>
    ),
  },
  TRANSACTION: {
    label: 'Transaction',
    bg: 'bg-cyan-500/15',
    color: '#06b6d4',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
        <polyline points="16 8 12 6 8 8" />
      </svg>
    ),
  },
  PAYMENT: {
    label: 'Payment',
    bg: 'bg-emerald-500/15',
    color: '#10b981',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" />
      </svg>
    ),
  },
  ACCOUNT: {
    label: 'Account',
    bg: 'bg-blue-500/15',
    color: '#3b82f6',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        <circle cx="12" cy="2" r="1" fill="#3b82f6" />
      </svg>
    ),
  },
  SYSTEM: {
    label: 'System',
    bg: 'bg-violet-500/15',
    color: '#8b5cf6',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <polyline points="7 8 12 13 17 8" />
      </svg>
    ),
  },
  INFORMATION: {
    label: 'Info',
    bg: 'bg-amber-500/15',
    color: '#f59e0b',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
      </svg>
    ),
  },
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
};

const DRAG_THRESHOLD = 75;

interface DraggableNewsItemProps {
  item: NewsItem;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  isNew?: boolean;
}

function DraggableNewsItem({ item, onArchive, onDelete, isNew }: DraggableNewsItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exiting, setExiting] = useState(false);
  const startXRef = useRef(0);
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.INFORMATION;

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
        <span className="text-red-400 text-xs font-semibold">Supprimer</span>
      </div>

      <div
        className="absolute inset-0 rounded-xl flex items-center justify-end pr-4 gap-2"
        style={{ opacity: isLeft ? progress : 0, background: `rgba(34,197,94,${0.15 * progress})` }}
      >
        <span className="text-green-400 text-xs font-semibold">Archiver</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" />
        </svg>
      </div>

      <div
        className="relative flex items-start gap-3 p-3.5 bg-[#1a1d24] rounded-xl border border-white/4 cursor-grab active:cursor-grabbing select-none"
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
          <p className="text-gray-400 text-[11px] mt-0.5 line-clamp-2 leading-relaxed pr-1">{item.content}</p>
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              className="mt-2 max-h-48 w-full object-cover rounded-lg border border-white/5"
            />
          )}
        </div>
        {isNew && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />}
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
  const [news, setNews] = useState<NewsItem[]>([]);
  const [archived, setArchived] = useState<NewsItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const removedIdsRef = useRef<Set<string>>(new Set());

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
      const arr = Array.isArray(payload) ? payload : ((payload as { data?: NewsItem[] })?.data ?? []);
      const filtered = (arr as NewsItem[]).filter((n) => !removedIdsRef.current.has(n.id) && !n.archivedAt);
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
      next.has(id) ? next.delete(id) : next.add(id);
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
          <h3 className="font-semibold text-white text-sm">{showArchived ? 'Archivés' : 'Actualités'}</h3>
          {!showArchived && news.length > 0 && (
            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full font-bold leading-none">{news.length}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!selectionMode && (
            <button onClick={() => setShowArchived((v) => !v)} className="text-gray-500 hover:text-gray-300 text-[11px] transition-colors">
              {showArchived ? '← Retour' : `Archivés (${archived.length})`}
            </button>
          )}
          {displayedNews.length > 0 && (
            <button
              onClick={() => (selectionMode ? exitSelection() : setSelectionMode(true))}
              className={`text-[11px] transition ${selectionMode ? 'text-gray-500 hover:text-gray-300' : 'text-cyan-400 hover:text-cyan-300'}`}
            >
              {selectionMode ? 'Annuler' : 'Sélectionner'}
            </button>
          )}
        </div>
      </div>

      {!showArchived && !selectionMode && news.length > 0 && (
        <p className="text-gray-700 text-[10px] mb-2.5 flex items-center gap-1.5">
          <span className="text-green-700">←</span> archiver
          <span className="mx-1 text-gray-800">·</span>
          supprimer <span className="text-red-800">→</span>
        </p>
      )}

      <div className="space-y-2">
        {displayedNews.length === 0 ? (
          <div className="py-8 text-center text-gray-600 text-xs">
            {showArchived ? 'Aucun élément archivé' : 'Aucune actualité'}
          </div>
        ) : showArchived ? (
          archived.map((item) => {
            const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.INFORMATION;
            const selected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => selectionMode && toggleSelect(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${selectionMode ? 'cursor-pointer' : ''} ${selected ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-[#1a1d24]/50 border-white/4'}`}
              >
                {selectionMode && (
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-cyan-400 bg-cyan-400' : 'border-gray-600'}`}>
                    {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                )}
                <div className={`rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} ${selectionMode ? 'w-7 h-7' : 'w-8 h-8'}`}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-xs font-medium truncate">{item.title}</p>
                  <p className="text-gray-600 text-[11px] mt-0.5 line-clamp-1">{item.content}</p>
                </div>
                {!selectionMode && (
                  <button onClick={() => handleUnarchive(item.id)} title="Désarchiver" className="text-gray-700 hover:text-cyan-400 text-[10px] transition shrink-0 mt-0.5">↩</button>
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
                    <p className="text-gray-400 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">{item.content}</p>
                  </div>
                </div>
              );
            }
            return (
              <DraggableNewsItem key={item.id} item={item} onArchive={handleArchive} onDelete={handleDelete} isNew={!seenIds.has(item.id)} />
            );
          })
        )}
      </div>

      {selectionMode && selectedIds.size > 0 && (
        <div className="mt-3 p-3 bg-[#1a1d24] rounded-xl border border-white/8 flex items-center justify-between gap-2">
          <span className="text-gray-400 text-[11px]">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            {showArchived ? (
              <button onClick={handleBulkUnarchive} className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 transition">Désarchiver</button>
            ) : (
              <button onClick={handleBulkArchive} className="text-[11px] px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition">Archiver</button>
            )}
            <button onClick={handleBulkDelete} className="text-[11px] px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition">Supprimer</button>
          </div>
        </div>
      )}
    </div>
  );
}
