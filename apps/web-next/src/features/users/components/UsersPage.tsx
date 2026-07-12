'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/features/chat/hooks';
import { UserSection } from './UserSection';
import { UserDetailsModal } from './UserDetailsModal';

/**
 * Page unique de gestion des utilisateurs (fusion des anciennes pages Users
 * et Admin) :
 *  - DIRECTOR / ADMIN : deux sections (Advisors, Clients) — tous les
 *    utilisateurs de ces rôles ;
 *  - ADVISOR : une seule section « Mes clients » (périmètre serveur).
 * ?userId=<id> ouvre directement une fiche (utilisé par les news ciblées).
 */
export function UsersPage() {
  const t = useTranslations('users');
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const roles = user?.roles ?? [];
  const isPrivileged = roles.includes('DIRECTOR') || roles.includes('ADMIN');
  const isAdvisor = roles.includes('ADVISOR');

  const [openedUserId, setOpenedUserId] = useState<string | null>(
    searchParams.get('userId') || null,
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [advisorIds, setAdvisorIds] = useState<string[]>([]);
  const [clientIds, setClientIds] = useState<string[]>([]);

  const presenceIds = useMemo(
    () => Array.from(new Set([...advisorIds, ...clientIds])),
    [advisorIds, clientIds],
  );
  const online = usePresence(presenceIds);

  const onAdvisorsLoaded = useCallback((ids: string[]) => setAdvisorIds(ids), []);
  const onClientsLoaded = useCallback((ids: string[]) => setClientIds(ids), []);

  const closeModal = useCallback(() => {
    setOpenedUserId(null);
    // Nettoie ?userId= sans recharger la page.
    const url = new URL(window.location.href);
    if (url.searchParams.has('userId')) {
      url.searchParams.delete('userId');
      router.replace(url.pathname + (url.searchParams.size ? `?${url.searchParams}` : ''));
    }
  }, [router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!isAdvisor && !isPrivileged) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-fg-muted text-sm">{t('accessRestricted')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white mb-1">{t('title')}</h1>
        <p className="text-fg-muted text-sm">
          {isPrivileged ? t('subtitlePrivileged') : t('subtitleAdvisor')}
        </p>
      </div>

      <div className={`grid gap-4 ${isPrivileged ? 'lg:grid-cols-2' : ''}`}>
        {isPrivileged && (
          <UserSection
            role="ADVISOR"
            title={t('sections.advisors')}
            online={online}
            onOpenUser={setOpenedUserId}
            onUsersLoaded={onAdvisorsLoaded}
            refreshKey={refreshKey}
          />
        )}
        <UserSection
          role="CLIENT"
          title={isPrivileged ? t('sections.clients') : t('sections.myClients')}
          online={online}
          onOpenUser={setOpenedUserId}
          onUsersLoaded={onClientsLoaded}
          refreshKey={refreshKey}
        />
      </div>

      {openedUserId && (
        <UserDetailsModal
          initialUserId={openedUserId}
          onCloseAction={closeModal}
          onDataChanged={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
