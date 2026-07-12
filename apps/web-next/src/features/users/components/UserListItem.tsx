'use client';

import { useTranslations } from 'next-intl';
import type { DirectoryUser } from '@/features/users/types';
import { UserPresenceBadge } from './UserPresenceBadge';

function initialsOf(firstName: string, lastName: string): string {
  return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase() || '?';
}

export function UserListItem({
  user,
  role,
  isOnline,
  onOpen,
}: {
  user: DirectoryUser;
  role: 'ADVISOR' | 'CLIENT';
  isOnline: boolean;
  onOpen: () => void;
}) {
  const t = useTranslations('users');

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white ring-1 ring-white/10">
          {initialsOf(user.firstName, user.lastName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-fg">
              {user.firstName} {user.lastName}
            </span>
            {user.isBanned && (
              <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-danger">
                {t('bannedBadge')}
              </span>
            )}
          </span>
          <span className="block truncate text-xs text-fg-muted">{user.email}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <UserPresenceBadge isOnline={isOnline} lastSeenAt={user.lastSeenAt} />
          {role === 'ADVISOR' && typeof user.clientCount === 'number' && (
            <span className="text-[11px] text-fg-muted">
              {t('clientCount', { count: user.clientCount })}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
