'use client';

import { useCallback, useRef, useState } from 'react';
import { Conversation } from '@/features/chat/useConversations';

interface UseOpenPrivateConversationOptions {
  onSuccess?: (conversationId: string, created: boolean) => void;
  onError?: (error: string) => void;
}

/**
 * Ouvre (ou rouvre) LA conversation privée avec un interlocuteur via l'endpoint
 * dédié : le backend applique les règles d'autorisation, déduplique par
 * identifiants et démasque une conversation masquée. Les doubles clics et
 * requêtes concurrentes côté client sont neutralisés par un verrou local.
 */
export function useOpenPrivateConversation(options?: UseOpenPrivateConversationOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const openPrivateConversation = useCallback(
    async (targetUserId: string): Promise<string | null> => {
      if (!targetUserId.trim() || inFlightRef.current) return null;

      inFlightRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch('/api/chat/conversations/private/open', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: targetUserId.trim() }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || `HTTP ${res.status}`);
        }
        const result = (await res.json()) as { conversationId: string; created: boolean };
        options?.onSuccess?.(result.conversationId, result.created);
        return result.conversationId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
        setError(errorMessage);
        options?.onError?.(errorMessage);
        return null;
      } finally {
        inFlightRef.current = false;
        setIsSubmitting(false);
      }
    },
    [options],
  );

  return { openPrivateConversation, isSubmitting, error };
}

export function useConversationsList(initialConversations: Conversation[]) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);

  const updateConversations = useCallback((newConversations: Conversation[]) => {
    setConversations(newConversations);
  }, []);

  return { conversations, updateConversations };
}
