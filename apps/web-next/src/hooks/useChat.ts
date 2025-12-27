'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface UseChatOptions {
  conversationId: string;
  userId: string;
  apiUrl?: string;
  wsUrl?: string;
}

export function useChat({ conversationId, userId, apiUrl = 'http://localhost:3001/api', wsUrl }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [presentUserIds, setPresentUserIds] = useState<string[]>([]);

  const derivedWsUrl = wsUrl
    || (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WS_URL)
    || `${apiUrl.replace(/\/$/, '').replace(/\/api$/, '')}/chat`;

  const { emit, on, off, isConnected } = useWebSocket({ url: derivedWsUrl, userId });

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiUrl}/chat/conversations/${conversationId}/messages`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load messages:', err);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadMessages();
  }, [conversationId, apiUrl]);

  useEffect(() => {
    if (isConnected) {
      emit('join_conversation', { conversationId, userId });
    }
  }, [isConnected, conversationId, userId, emit]);

  useEffect(() => {
    const handleNewMessage = (msg?: unknown) => {
      if (msg && typeof msg === 'object' && 'messageId' in msg) {
        setMessages((prev) => [...prev, msg as Message]);
      }
    };

    const handleUserTyping = (data?: unknown) => {
      if (data && typeof data === 'object' && 'userId' in data) {
        setTypingUsers((prev) => new Set(prev).add((data as { userId: string }).userId));
      }
    };

    const handleUserStoppedTyping = (data?: unknown) => {
      if (data && typeof data === 'object' && 'userId' in data) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete((data as { userId: string }).userId);
          return newSet;
        });
      }
    };

    const handlePresenceUpdate = (data?: unknown) => {
      if (data && typeof data === 'object' && 'userIds' in data) {
        const arr = (data as { userIds: string[] }).userIds;
        if (Array.isArray(arr)) setPresentUserIds(arr);
      }
    };

    on('new_message', handleNewMessage);
    on('user_typing', handleUserTyping);
    on('user_stopped_typing', handleUserStoppedTyping);
    on('presence_update', handlePresenceUpdate);

    return () => {
      off('new_message', handleNewMessage);
      off('user_typing', handleUserTyping);
      off('user_stopped_typing', handleUserStoppedTyping);
      off('presence_update', handlePresenceUpdate);
    };
  }, [on, off]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      emit('send_message', { conversationId, senderId: userId, content });
    },
    [emit, conversationId, userId],
  );

  const startTyping = useCallback(() => {
    emit('typing_start', { conversationId, userId });
  }, [emit, conversationId, userId]);

  const stopTyping = useCallback(() => {
    emit('typing_stop', { conversationId, userId });
  }, [emit, conversationId, userId]);

  return {
    messages,
    typingUsers: Array.from(typingUsers),
    isLoading,
    isConnected,
    presentUserIds,
    sendMessage,
    startTyping,
    stopTyping,
  };
}
