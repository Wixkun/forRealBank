'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { emitChatEvent } from '@/features/chat/chat-events';

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
  // Socket.IO est hébergé par l'API Nest, namespace `/chat`, path `/api/socket.io`.
  // Si NEXT_PUBLIC_WS_URL est fourni, on le respecte.
  if (typeof window === 'undefined') {
    const apiUrl = process.env.API_URL || 'http://api:3001';
    return `${apiUrl.replace(/\/api$/, '')}/chat`;
  }

  const envUrl = (process.env.NEXT_PUBLIC_WS_URL || '').trim();
  if (envUrl) return envUrl.replace(/\/$/, '');

  const current = new URL(window.location.href);
  // En dev, Next (3000) et l'API (3001) sont deux serveurs distincts.
  // En prod, Traefik route /api/socket.io vers l'API sur la même origine.
  if (current.port === '3000') current.port = '3001';
  current.pathname = '/chat';
  current.search = '';
  current.hash = '';
  return current.toString();
}

export function useChat({ conversationId, userId, apiUrl = '/api', wsUrl }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [presentUserIds, setPresentUserIds] = useState<string[]>([]);
  // Présence GLOBALE (en ligne / hors ligne), distincte de la présence « dans
  // la room » : alimentée par le snapshot initial puis les transitions.
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const lastMarkedRef = useRef<string | null>(null);

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
        // L'API REST expose `id` là où le socket émet `messageId` : on
        // normalise, sinon le marquage « lu » à l'ouverture ne part jamais
        // (badge non-lu et notification jamais réinitialisés).
        const list = Array.isArray(data) ? (data as Array<Message & { id?: string }>) : [];
        setMessages(list.map((m) => ({ ...m, messageId: m.messageId ?? m.id ?? '' })));
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

    // Présence globale : snapshot initial (liste complète des connectés).
    const handlePresenceSnapshot = (data?: unknown) => {
      if (data && typeof data === 'object' && 'userIds' in data) {
        const arr = (data as { userIds: string[] }).userIds;
        if (Array.isArray(arr)) setOnlineUserIds(new Set(arr));
      }
    };

    // Présence globale : transition en ligne / hors ligne d'un utilisateur.
    const handleUserPresence = (data?: unknown) => {
      if (data && typeof data === 'object' && 'userId' in data && 'online' in data) {
        const { userId: uid, online } = data as { userId: string; online: boolean };
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          if (online) next.add(uid);
          else next.delete(uid);
          return next;
        });
      }
    };

    on('new_message', handleNewMessage);
    on('user_typing', handleUserTyping);
    on('user_stopped_typing', handleUserStoppedTyping);
    on('presence_update', handlePresenceUpdate);
    on('presence_snapshot', handlePresenceSnapshot);
    on('user_presence', handleUserPresence);

    return () => {
      off('new_message', handleNewMessage);
      off('user_typing', handleUserTyping);
      off('user_stopped_typing', handleUserStoppedTyping);
      off('presence_update', handlePresenceUpdate);
      off('presence_snapshot', handlePresenceSnapshot);
      off('user_presence', handleUserPresence);
    };
  }, [on, off]);

  // Marque la conversation comme lue à l'ouverture et à chaque nouveau message
  // reçu pendant qu'elle est VISIBLE : un onglet en arrière-plan ne marque pas
  // ce que l'utilisateur n'a pas pu voir (rattrapage au retour de visibilité).
  // Persiste l'état côté serveur (survit au rechargement / reconnexion / autre
  // appareil) puis notifie les autres vues. Le ref n'est avancé qu'après
  // confirmation serveur : un échec réseau sera rejoué.
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage.messageId) return;

    const markRead = async () => {
      if (document.visibilityState !== 'visible') return;
      if (lastMessage.messageId === lastMarkedRef.current) return;
      try {
        const res = await fetch(`${apiUrl}/chat/conversations/${conversationId}/state`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastReadMessageId: lastMessage.messageId }),
        });
        if (res.ok) {
          lastMarkedRef.current = lastMessage.messageId;
          // Notifie la liste et le centre de notifications de se rafraîchir.
          emitChatEvent('chat:read', { conversationId });
        }
      } catch {
        // Non bloquant : le ref n'a pas été avancé, le retour de visibilité ou
        // le prochain message retentera le marquage.
      }
    };

    markRead();
    document.addEventListener('visibilitychange', markRead);
    return () => document.removeEventListener('visibilitychange', markRead);
  }, [messages, conversationId, apiUrl]);

  return {
    messages,
    typingUsers: Array.from(typingUsers),
    presentUserIds,
    onlineUserIds,
    isLoading,
    isConnected,
    sendMessage: useCallback(
      (content: string) => {
        emit('send_message', { conversationId, senderId: userId, content });
      },
      [emit, conversationId, userId],
    ),
    startTyping: useCallback(
      () => emit('typing_start', { conversationId, userId }),
      [emit, conversationId, userId],
    ),
    stopTyping: useCallback(
      () => emit('typing_stop', { conversationId, userId }),
      [emit, conversationId, userId],
    ),
  };
}
