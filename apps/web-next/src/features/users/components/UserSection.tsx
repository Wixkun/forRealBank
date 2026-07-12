'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchDirectory } from '@/features/users/api';
import type { DirectoryUser } from '@/features/users/types';
import { UserListItem } from './UserListItem';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Section d'annuaire (Advisors ou Clients / Mes clients) : titre, compteur,
 * recherche serveur debouncée, liste et états chargement / vide / erreur.
 * Le périmètre (advisor → ses clients) est appliqué CÔTÉ SERVEUR.
 */
export function UserSection({
  role,
  title,
  online,
  onOpenUser,
  onUsersLoaded,
  refreshKey = 0,
}: {
  role: 'ADVISOR' | 'CLIENT';
  title: string;
  online: Record<string, boolean>;
  onOpenUser: (userId: string) => void;
  // Remonte les ids affichés au parent (souscription à la présence).
  onUsersLoaded?: (ids: string[]) => void;
  // Incrémenté par le parent après une action (ban, réattribution…) pour
  // recharger la liste.
  refreshKey?: number;
}) {
  const t = useTranslations('users');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<DirectoryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const load = useCallback(
    async (term: string) => {
      setIsLoading(true);
      setError(false);
      try {
        const list = await fetchDirectory(role, term);
        setItems(list);
        onUsersLoaded?.(list.map((u) => u.id));
      } catch {
        setError(true);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    },
    // onUsersLoaded volontairement hors dépendances : callback parent stable
    // par convention (useCallback), éviter une boucle de rechargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role],
  );

  useEffect(() => {
    void load(search);
    // Recharge uniquement au montage / refresh demandé (la recherche a son
    // propre déclencheur debouncé ci-dessous).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, refreshKey]);

  const onSearchChange = (next: string) => {
    setSearch(next);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => void load(next), SEARCH_DEBOUNCE_MS);
  };

  return (
    <section className="bg-surface-1 rounded-2xl border border-white/5 flex flex-col min-h-0">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-white text-sm font-semibold">{title}</h2>
          <span className="text-xs text-fg-muted bg-white/5 rounded-full px-2 py-0.5">
            {items.length}
          </span>
        </div>
        <div className="relative">
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-fg-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white placeholder:text-fg-subtle focus:outline-none focus:border-primary/60"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim max-h-104">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        ) : error ? (
          <p className="p-4 text-sm text-red-300">{t('loadError')}</p>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-fg-muted">
            {search.trim() ? t('emptySearch') : t('empty')}
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((user) => (
              <UserListItem
                key={user.id}
                user={user}
                role={role}
                isOnline={online[user.id] ?? false}
                onOpen={() => onOpenUser(user.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
