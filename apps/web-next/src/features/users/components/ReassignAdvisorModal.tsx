'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePresence } from '@/features/chat/hooks';
import { fetchDirectory, reassignClient } from '@/features/users/api';
import type { DirectoryUser, UserDetails } from '@/features/users/types';
import { UserPresenceBadge } from './UserPresenceBadge';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * « Changer d'advisor » (DIRECTOR/ADMIN) : sous-vue de la modale de fiche,
 * avec recherche serveur debouncée (prénom / nom / nom complet / email).
 * Les advisors bannis sont proposés mais non sélectionnables (le backend les
 * refuse de toute façon) ; l'advisor actuel est exclu.
 */
export function ReassignAdvisorModalView({
  client,
  onDone,
}: {
  client: UserDetails;
  onDone: () => void;
}) {
  const t = useTranslations('users.reassign');
  const tUsers = useTranslations('users');
  const [search, setSearch] = useState('');
  const [advisors, setAdvisors] = useState<DirectoryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const online = usePresence(useMemo(() => advisors.map((a) => a.id), [advisors]));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const list = await fetchDirectory('ADVISOR', search);
        if (!cancelled) setAdvisors(list);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    // Premier chargement immédiat, recherches suivantes debouncées.
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => void load(), search ? SEARCH_DEBOUNCE_MS : 0);

    return () => {
      cancelled = true;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search]);

  const choose = async (advisorId: string) => {
    setSubmittingId(advisorId);
    setSubmitError(false);
    try {
      await reassignClient(client.id, advisorId);
      onDone();
    } catch {
      setSubmitError(true);
      setSubmittingId(null);
    }
  };

  const candidates = advisors.filter((a) => a.id !== client.advisor?.id);

  return (
    <div className="px-5 py-4 space-y-4">
      <p className="text-sm text-fg-muted">
        {t('subtitle', { name: `${client.firstName} ${client.lastName}` })}
      </p>

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
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="w-full rounded-lg border border-edge-strong bg-input py-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary/60"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{t('loadError')}</p>
      ) : candidates.length === 0 ? (
        <p className="text-sm text-fg-muted">
          {search.trim() ? tUsers('emptySearch') : t('empty')}
        </p>
      ) : (
        <ul className="divide-y divide-edge rounded-xl border border-edge bg-input">
          {candidates.map((advisor) => (
            <li key={advisor.id}>
              <button
                type="button"
                onClick={() => void choose(advisor.id)}
                disabled={advisor.isBanned || submittingId !== null}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm text-fg">
                      {advisor.firstName} {advisor.lastName}
                    </span>
                    {advisor.isBanned && (
                      <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-danger">
                        {t('banned')}
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-fg-muted">
                    {t('clientCount', { count: advisor.clientCount ?? 0 })}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <UserPresenceBadge
                    isOnline={online[advisor.id] ?? false}
                    lastSeenAt={advisor.lastSeenAt}
                  />
                  {submittingId === advisor.id && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {submitError && <p className="text-xs text-danger">{t('error')}</p>}
    </div>
  );
}
