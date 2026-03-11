'use client';

import { useCallback, useState } from 'react';
import { ConversationData } from '@/lib/cache/conversations';

interface UseCreateConversationOptions {
  onSuccess?: (conversationId: string) => void;
  onError?: (error: string) => void;
}

export function useCreateConversation(options?: UseCreateConversationOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_URL = '/api/proxy';

  const createPrivateConversation = useCallback(
    async (targetUserId: string, currentUserId: string) => {
      if (!targetUserId.trim() || !currentUserId) {
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const createRes = await fetch(`${API_URL}/chat/conversations`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'PRIVATE' }),
        });
        if (!createRes.ok) throw new Error(`HTTP ${createRes.status}`);
        const created = await createRes.json();
        const convId: string = created.conversationId || created.id;

        const addCurrentRes = await fetch(`${API_URL}/chat/conversations/${convId}/participants`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId }),
        });
        if (!addCurrentRes.ok) throw new Error(`HTTP ${addCurrentRes.status}`);

        const addTargetRes = await fetch(`${API_URL}/chat/conversations/${convId}/participants`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: targetUserId.trim() }),
        });
        if (!addTargetRes.ok) throw new Error(`HTTP ${addTargetRes.status}`);

        options?.onSuccess?.(convId);
        return convId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inattendue';
        setError(errorMessage);
        options?.onError?.(errorMessage);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [API_URL, options],
  );

  return {
    createPrivateConversation,
    isSubmitting,
    error,
  };
}

export function useConversationsList(initialConversations: ConversationData[]) {
  const [conversations, setConversations] = useState<ConversationData[]>(initialConversations);

  const hasPrivateConversationWith = useCallback(
    (targetUserId: string) =>
      conversations.some(
        (conv: ConversationData) =>
          conv.type === 'PRIVATE' && conv.participants?.some((p) => p.id === targetUserId),
      ),
    [conversations],
  );

  const openConversationWith = useCallback(
    (targetUserId: string) => {
      const existing = conversations.find(
        (conv: ConversationData) =>
          conv.type === 'PRIVATE' && conv.participants?.some((p) => p.id === targetUserId),
      );
      return existing?.id || null;
    },
    [conversations],
  );

  const updateConversations = useCallback((newConversations: ConversationData[]) => {
    setConversations(newConversations);
  }, []);

  return {
    conversations,
    isLoading: false,
    hasPrivateConversationWith,
    openConversationWith,
    updateConversations,
  };
}
