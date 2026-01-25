'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Conversation {
  id: string;
  name: string;
  type: 'PRIVATE' | 'GROUP';
  participants?: Array<{ id: string; firstName: string; lastName: string; role?: string }>;
  createdAt?: string;
  description?: string;
  lastMessage?: string;
  lastMessageDate?: string;
}

interface UseConversationsOptions {
  apiUrl?: string;
}

export function useConversations({
  apiUrl = 'http://localhost:3001/api',
}: UseConversationsOptions = {}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const refresh = useCallback(async () => {
    if (!user?.id) {
      console.log('[useConversations] Waiting for user to load');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/chat/conversations/by-user/${user.id}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const conversations = Array.isArray(data) ? data : [];
      setConversations(conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    conversations,
    isLoading,
    error,
    setConversations,
    refresh,
  };
}
