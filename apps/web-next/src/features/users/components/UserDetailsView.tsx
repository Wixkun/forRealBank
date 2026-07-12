'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/features/chat/hooks';
import { banUser, fetchClientAccounts, fetchUserDetails, unbanUser } from '@/features/users/api';
import type { ClientAccounts, ManagedAccount, UserDetails } from '@/features/users/types';
import { UserPresenceBadge } from './UserPresenceBadge';
import { ClientAccountsPanel } from './ClientAccountsPanel';

// Miroir frontend de la matrice backend (le serveur revalide toujours) :
// DIRECTOR → CLIENT/ADVISOR ; ADMIN → tout sauf ADMIN ; jamais soi-même.
function canActorBan(actorRoles: string[], actorId: string, target: UserDetails): boolean {
  if (actorId === target.id) return false;
  if (target.roles.includes('ADMIN')) return false;
  if (actorRoles.includes('ADMIN')) return true;
  if (actorRoles.includes('DIRECTOR')) return !target.roles.includes('DIRECTOR');
  return false;
}

export function UserDetailsView({
  userId,
  onOpenUser,
  onOpenAccount,
  onOpenReassign,
  onOpenRequestBan,
  onDataChanged,
  onClose,
}: {
  userId: string;
  onOpenUser: (userId: string) => void;
  onOpenAccount: (ownerId: string, ownerName: string, account: ManagedAccount) => void;
  onOpenReassign: (client: UserDetails) => void;
  onOpenRequestBan: (client: UserDetails) => void;
  onDataChanged: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('users.details');
  const locale = useLocale();
  const router = useRouter();
  const { user: me } = useAuth();

  const [details, setDetails] = useState<UserDetails | null>(null);
  const [accounts, setAccounts] = useState<ClientAccounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  // Présence fiable (sockets authentifiés du cluster), rafraîchie en continu.
  const online = usePresence(useMemo(() => [userId], [userId]));

  const isClient = details?.roles.includes('CLIENT') ?? false;
  const isAdvisorSheet = details?.roles.includes('ADVISOR') ?? false;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const data = await fetchUserDetails(userId);
      setDetails(data);
      if (data.roles.includes('CLIENT')) {
        // Comptes chargés en parallèle de l'affichage de la fiche.
        try {
          setAccounts(await fetchClientAccounts(userId));
        } catch {
          setAccounts(null);
        }
      }
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const myRoles = me?.roles ?? [];
  const isPrivileged = myRoles.includes('DIRECTOR') || myRoles.includes('ADMIN');
  const isAdvisorActor =
    myRoles.includes('ADVISOR') && !myRoles.includes('DIRECTOR') && !myRoles.includes('ADMIN');

  // « Envoyer un message » : le backend (règles de contact) tranche ; on
  // n'affiche le bouton que pour les paires plausibles, jamais pour soi-même.
  const canMessage = Boolean(details && me && details.id !== me.id);

  const sendMessage = async () => {
    if (!details) return;
    setIsActing(true);
    setActionError(null);
    try {
      const res = await fetch('/api/chat/conversations/private/open', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: details.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { conversationId: string };
      onClose();
      router.push(`/${locale}/dashboard/messages?conversationId=${data.conversationId}`);
    } catch {
      setActionError(t('messageError'));
    } finally {
      setIsActing(false);
    }
  };

  const toggleBan = async () => {
    if (!details) return;
    setIsActing(true);
    setActionError(null);
    try {
      if (details.isBanned) await unbanUser(details.id);
      else await banUser(details.id);
      await load();
      onDataChanged();
    } catch {
      setActionError(t('banError'));
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }
  if (error || !details) {
    return <p className="p-6 text-sm text-danger">{t('loadError')}</p>;
  }

  const fullName = `${details.firstName} ${details.lastName}`.trim();
  const createdAt = details.createdAt
    ? new Date(details.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')
    : null;

  return (
    <div className="px-5 py-4 space-y-5">
      {/* ── Identité ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white ring-1 ring-white/10">
          {(details.firstName[0] ?? '') + (details.lastName[0] ?? '')}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-fg text-base font-semibold">{fullName}</h3>
            {details.isBanned ? (
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-danger">
                {t('statusBanned')}
              </span>
            ) : (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-tertiary">
                {t('statusActive')}
              </span>
            )}
          </div>
          <p className="text-sm text-fg-muted truncate">{details.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <UserPresenceBadge
              isOnline={online[details.id] ?? false}
              lastSeenAt={details.lastSeenAt}
            />
            <span className="text-xs text-fg-subtle">
              {details.roles.map((role) => t(`roles.${role}` as never)).join(' · ')}
            </span>
            {createdAt && (
              <span className="text-xs text-fg-subtle">
                {t('memberSince', { date: createdAt })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Advisor attribué (fiche client) — cliquable ──────────────────── */}
      {isClient && (
        <div className="rounded-xl border border-edge bg-input p-3">
          <p className="text-xs text-fg-muted mb-1.5">{t('assignedAdvisor')}</p>
          {details.advisor ? (
            <button
              type="button"
              onClick={() => onOpenUser(details.advisor!.id)}
              className="text-sm font-medium text-tertiary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded"
            >
              {details.advisor.firstName} {details.advisor.lastName}
            </button>
          ) : (
            <p className="text-sm text-fg-muted">{t('noAdvisor')}</p>
          )}
        </div>
      )}

      {/* ── Clients attribués (fiche advisor) — cliquables ───────────────── */}
      {isAdvisorSheet && (
        <div className="rounded-xl border border-edge bg-input p-3">
          <p className="text-xs text-fg-muted mb-2">
            {t('assignedClients', { count: details.clientCount ?? 0 })}
          </p>
          {(details.clients?.length ?? 0) === 0 ? (
            <p className="text-sm text-fg-muted">{t('noClients')}</p>
          ) : (
            <ul className="space-y-1">
              {details.clients!.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => onOpenUser(client.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-fg hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  >
                    <span className="truncate">
                      {client.firstName} {client.lastName}
                    </span>
                    {client.isBanned && (
                      <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-danger">
                        {t('statusBanned')}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Comptes du client (lecture seule) ────────────────────────────── */}
      {isClient && accounts && (
        <ClientAccountsPanel
          accounts={accounts}
          onOpenAccount={(account) => onOpenAccount(details.id, fullName, account)}
        />
      )}

      {actionError && <p className="text-xs text-danger">{actionError}</p>}

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 border-t border-edge pt-4">
        {canMessage && (
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={isActing}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition disabled:opacity-50"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {t('sendMessage')}
          </button>
        )}

        {isClient && isPrivileged && (
          <button
            type="button"
            onClick={() => onOpenReassign(details)}
            disabled={isActing}
            className="rounded-lg border border-edge-strong bg-hover px-3 py-2 text-xs font-semibold text-fg-secondary hover:bg-hover-strong transition disabled:opacity-50"
          >
            {t('changeAdvisor')}
          </button>
        )}

        {isClient &&
          isAdvisorActor &&
          !details.isBanned &&
          details.advisor?.id === me?.id &&
          !details.hasPendingBanRequest && (
            <button
              type="button"
              onClick={() => onOpenRequestBan(details)}
              disabled={isActing}
              className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-danger hover:bg-red-500/20 transition disabled:opacity-50"
            >
              {t('requestBan')}
            </button>
          )}

        {me && canActorBan(myRoles, me.id, details) && (
          <button
            type="button"
            onClick={() => void toggleBan()}
            disabled={isActing}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
              details.isBanned
                ? 'border border-edge-strong bg-hover text-fg-secondary hover:bg-hover-strong'
                : 'border border-red-400/30 bg-red-500/10 text-danger hover:bg-red-500/20'
            }`}
          >
            {details.isBanned ? t('unban') : t('ban')}
          </button>
        )}
      </div>
    </div>
  );
}
