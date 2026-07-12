'use client';

import { useTranslations } from 'next-intl';
import { formatLastSeen } from '@/features/users/presence';

/**
 * Statut de présence : point vert + « En ligne » (au moins un socket
 * authentifié actif), sinon « Hors ligne depuis … » d'après last_seen_at.
 * Un utilisateur jamais connecté n'affiche rien (pas de date fictive).
 */
export function UserPresenceBadge({
  isOnline,
  lastSeenAt,
}: {
  isOnline: boolean;
  lastSeenAt: string | null | undefined;
}) {
  const t = useTranslations('users.presence');

  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-tertiary">
        <span className="h-2 w-2 rounded-full bg-tertiary" aria-hidden="true" />
        {t('online')}
      </span>
    );
  }

  const since = formatLastSeen(lastSeenAt, (key, values) => t(`lastSeen.${key}`, values));
  if (!since) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
      <span className="h-2 w-2 rounded-full bg-fg-subtle" aria-hidden="true" />
      {t('offlineSince', { duration: since })}
    </span>
  );
}
