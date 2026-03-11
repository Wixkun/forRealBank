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

function defaultWsUrl(): string {
  // En dev, Socket.IO est hébergé par l'API Nest (port 3001), namespace `/chat`.
  // Si NEXT_PUBLIC_WS_URL est fourni, on le respecte.
  if (typeof window === 'undefined') return 'http://localhost:3001/chat';

  const envUrl = (process.env.NEXT_PUBLIC_WS_URL || '').trim();
  if (envUrl) return envUrl.replace(/\/$/, '');

  const current = new URL(window.location.href);
  current.port = '3001';
  current.pathname = '/chat';
  current.search = '';
  current.hash = '';
  return current.toString();
}

export function useChat({
  conversationId,
  userId,
  apiUrl = '/api/proxy',
  wsUrl,
}: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [presentUserIds, setPresentUserIds] = useState<string[]>([]);

  const derivedWsUrl = wsUrl || defaultWsUrl();

  const { emit, on, off, isConnected } = useWebSocket({ url: derivedWsUrl, userId });

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiUrl}/chat/conversations/${conversationId}/messages`, {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setMessages(Array.isArray(data) ? (data as Message[]) : []);
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
        const incoming = msg as Message;
        setMessages((prev) => {
          const alreadySameId = prev.some((m) => m.messageId === incoming.messageId);
          const alreadySameContent = prev.some(
            (m) =>
              m.senderId === incoming.senderId &&
              m.content === incoming.content &&
              m.createdAt === incoming.createdAt,
          );
          if (alreadySameId || alreadySameContent) {
            return prev;
          }
          return [...prev, incoming];
        });
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

  return {
    messages,
    typingUsers: Array.from(typingUsers),
    presentUserIds,
    isLoading,
    isConnected,
    sendMessage: useCallback(
      (content: string) => {
        emit('send_message', { conversationId, senderId: userId, content });
      },
      [emit, conversationId, userId],
    ),
    startTyping: useCallback(() => emit('typing_start', { conversationId, userId }), [emit, conversationId, userId]),
    stopTyping: useCallback(() => emit('typing_stop', { conversationId, userId }), [emit, conversationId, userId]),
  };
}
