'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ModalShell } from '@/components/ui/ModalShell';
import type { ManagedAccount, UserDetails } from '@/features/users/types';
import { UserDetailsView } from './UserDetailsView';
import { AccountTransactionsView } from './AccountTransactionsView';
import { ReassignAdvisorModalView } from './ReassignAdvisorModal';
import { RequestBanModal } from './RequestBanModal';

export type ModalView =
  | { type: 'user'; userId: string }
  | { type: 'account'; ownerId: string; ownerName: string; account: ManagedAccount }
  | { type: 'reassign'; client: UserDetails }
  | { type: 'requestBan'; client: UserDetails };

/**
 * Modale UNIQUE de fiche détaillée : la navigation interne (client → advisor
 * → autre client → compte → …) empile des vues dans la même modale, avec un
 * bouton Retour — jamais de modales superposées.
 */
export function UserDetailsModal({
  initialUserId,
  onCloseAction,
  onDataChanged,
}: {
  initialUserId: string;
  onCloseAction: () => void;
  // Averti la page après une action qui modifie les listes (ban, réattribution…).
  onDataChanged: () => void;
}) {
  const t = useTranslations('users.modal');
  const [stack, setStack] = useState<ModalView[]>([{ type: 'user', userId: initialUserId }]);
  const current = stack[stack.length - 1];

  const push = useCallback((view: ModalView) => setStack((s) => [...s, view]), []);
  const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const openUser = useCallback((userId: string) => push({ type: 'user', userId }), [push]);

  return (
    <ModalShell
      onCloseAction={onCloseAction}
      maxWidthClass="max-w-2xl"
      cardClassName="max-h-[92vh] overflow-y-auto scrollbar-slim max-sm:h-full max-sm:max-h-full max-sm:rounded-none"
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          {stack.length > 1 && (
            <button
              type="button"
              onClick={pop}
              className="p-1.5 rounded-lg text-fg-muted hover:text-white hover:bg-white/5 transition"
              aria-label={t('back')}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <h2 className="text-white text-sm font-semibold">
            {current.type === 'user' && t('titleUser')}
            {current.type === 'account' && t('titleAccount')}
            {current.type === 'reassign' && t('titleReassign')}
            {current.type === 'requestBan' && t('titleRequestBan')}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCloseAction}
          className="p-1.5 rounded-lg text-fg-muted hover:text-white hover:bg-white/5 transition"
          aria-label={t('close')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {current.type === 'user' && (
        <UserDetailsView
          userId={current.userId}
          onOpenUser={openUser}
          onOpenAccount={(ownerId, ownerName, account) =>
            push({ type: 'account', ownerId, ownerName, account })
          }
          onOpenReassign={(client) => push({ type: 'reassign', client })}
          onOpenRequestBan={(client) => push({ type: 'requestBan', client })}
          onDataChanged={onDataChanged}
          onClose={onCloseAction}
        />
      )}
      {current.type === 'account' && (
        <AccountTransactionsView ownerName={current.ownerName} account={current.account} />
      )}
      {current.type === 'reassign' && (
        <ReassignAdvisorModalView
          client={current.client}
          onDone={() => {
            onDataChanged();
            pop();
          }}
        />
      )}
      {current.type === 'requestBan' && (
        <RequestBanModal
          client={current.client}
          onDone={() => {
            onDataChanged();
            pop();
          }}
        />
      )}
    </ModalShell>
  );
}
