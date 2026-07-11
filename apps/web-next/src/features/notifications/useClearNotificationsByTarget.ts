'use client';

import { useEffect } from 'react';
import { emitChatEvent } from '@/features/chat/chat-events';

// Types de cible acceptés par PATCH /notifications/read-by-target
// (miroir de NotificationTargetType côté domaine).
export type NotificationTarget =
  | 'CONVERSATION'
  | 'MESSAGE'
  | 'ACCOUNT'
  | 'TRANSACTION'
  | 'PAYMENT'
  | 'NEWS'
  | 'URL';

/**
 * Consulter le détail d'une entité (news, transaction, paiement, compte...)
 * marque lues les notifications qui la ciblent — comme l'ouverture d'une
 * conversation le fait pour les messages. À brancher dans tout composant qui
 * affiche une popup/vue de détail : passer `null` tant que rien n'est ouvert.
 */
export function useClearNotificationsByTarget(
  targetType: NotificationTarget,
  targetId: string | null | undefined,
  { apiUrl = '/api', enabled = true }: { apiUrl?: string; enabled?: boolean } = {},
) {
  useEffect(() => {
    if (!targetId || !enabled) return;
    (async () => {
      try {
        const res = await fetch(
          `${apiUrl}/notifications/read-by-target/${targetType}/${targetId}`,
          {
            method: 'PATCH',
            credentials: 'include',
          },
        );
        if (res.ok) {
          const data = await res.json().catch(() => null);
          // Ne rafraîchit le centre de notifications que si quelque chose a
          // réellement été marqué lu.
          if (data?.affected > 0) emitChatEvent('notifications:read');
        }
      } catch {
        // Non bloquant : le polling du centre de notifications prend le relais.
      }
    })();
  }, [targetType, targetId, apiUrl, enabled]);
}
