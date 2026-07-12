'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/features/chat/useChat';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import MessageComposer, {
  type MessageComposerHandle,
  IconPdf,
} from '@/features/chat/components/MessageComposer';
import { BanRequestMessageCard } from '@/features/chat/components/BanRequestMessageCard';
import { parseMessageContent, type ChatAttachment } from '@/features/chat/attachments';
import { fetchBanRequestsByConversation } from '@/features/users/api';
import type { BanRequestCard } from '@/features/users/types';
import { formatFileSize } from '@/lib/uploads/images';

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface Conversation {
  id: string;
  name: string;
  type: 'PRIVATE' | 'GROUP';
  participants?: Participant[];
}

interface ChatDisplayProps {
  conversationId: string;
  userId: string;
  conversation?: Conversation;
  advisorName?: string;
  advisorRole?: string;
}

function AttachmentView({
  attachment,
  isOwnMessage,
  isDark,
  imageAlt,
}: {
  attachment: ChatAttachment;
  isOwnMessage: boolean;
  isDark: boolean;
  imageAlt: string;
}) {
  if (attachment.kind === 'image') {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.name || imageAlt}
          loading="lazy"
          className="max-w-full max-h-64 h-auto w-auto rounded-lg border border-edge-strong object-contain"
        />
      </a>
    );
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
        isOwnMessage
          ? // Pièce jointe dans MA bulle (fond teal constant) : blanc fixe,
            // indépendant du thème.
            'border-white/20 bg-white/10 text-white hover:bg-white/20'
          : isDark
            ? 'border-edge-strong bg-surface-3 text-fg hover:bg-hover-strong'
            : 'border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100'
      }`}
    >
      <span className={isOwnMessage ? 'text-white/80' : 'text-danger'}>
        <IconPdf />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium truncate max-w-48">
          {attachment.name || 'PDF'}
        </span>
        {attachment.size > 0 && (
          <span
            className={`block text-xs ${
              isOwnMessage ? 'text-white/70' : isDark ? 'text-fg-muted' : 'text-gray-500'
            }`}
          >
            {formatFileSize(attachment.size)}
          </span>
        )}
      </span>
    </a>
  );
}

export default function ChatDisplay({
  conversationId,
  userId,
  conversation,
  advisorName,
  advisorRole,
}: ChatDisplayProps) {
  const [senderNames, setSenderNames] = useState<{ [key: string]: string }>({});
  const [senderRoles, setSenderRoles] = useState<{ [key: string]: string }>({});
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<MessageComposerHandle>(null);
  const { theme } = useTheme();
  const t = useTranslations('chat');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const isDark = theme === 'dark';

  const {
    messages,
    typingUsers,
    isConnected,
    onlineUserIds,
    sendMessage,
    startTyping,
    stopTyping,
  } = useChat({
    conversationId,
    userId,
  });

  useEffect(() => {
    if (conversation?.type === 'GROUP' && conversation?.participants) {
      const names: { [key: string]: string } = {};
      const roles: { [key: string]: string } = {};
      conversation.participants.forEach((p) => {
        names[p.id] = `${p.firstName} ${p.lastName}`;
        roles[p.id] = p.role || '';
      });
      setSenderNames(names);
      setSenderRoles(roles);
    }
  }, [conversation]);

  // On ne fait défiler QUE la zone de messages : scrollIntoView() ferait
  // défiler tous les ancêtres (y compris la carte en overflow-hidden), ce qui
  // décale toute la page et masque les en-têtes.
  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    // Repli scrollTop : jsdom (tests) n'implémente pas Element.scrollTo.
    if (typeof el.scrollTo === 'function')
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    else el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Drag & drop de fichiers sur toute la zone de conversation : les fichiers
  // sont transmis au composer, qui gère validation et aperçus.
  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');

  const handleDragEnter = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) composerRef.current?.addFiles(files);
  };

  const isGroupChat = conversation?.type === 'GROUP';
  // Présence réelle de l'interlocuteur d'une conversation privée : l'autre
  // participant est-il en ligne (au moins un socket authentifié actif) ?
  // Jamais dérivée de « mon » socket ni d'une valeur codée en dur.
  const otherParticipant = conversation?.participants?.find((p) => p.id !== userId);

  // ── Demandes de bannissement liées à cette conversation ──────────────────
  // Les messages correspondants sont rendus comme cartes structurées avec
  // Accepter / Refuser pour le director assigné. 403 silencieux pour les
  // rôles non concernés (clients).
  const [banRequestsByMessage, setBanRequestsByMessage] = useState<Map<string, BanRequestCard>>(
    new Map(),
  );
  const loadBanRequests = useCallback(async () => {
    try {
      const requests = await fetchBanRequestsByConversation(conversationId);
      setBanRequestsByMessage(
        new Map(
          requests
            .filter((request) => request.messageId)
            .map((request) => [request.messageId as string, request]),
        ),
      );
    } catch {
      setBanRequestsByMessage(new Map());
    }
  }, [conversationId]);
  useEffect(() => {
    void loadBanRequests();
  }, [loadBanRequests]);

  // ── Conversation gelée (relation advisor-client retirée) ─────────────────
  // Le backend refuse l'envoi de toute façon ; le composer est remplacé par
  // un bandeau. L'historique reste consultable.
  const [isWritable, setIsWritable] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setIsWritable(true);
    (async () => {
      try {
        const res = await fetch(`/api/chat/conversations/${conversationId}/writable`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = (await res.json()) as { writable?: boolean };
        if (!cancelled) setIsWritable(data.writable !== false);
      } catch {
        // Repli : on laisse le composer, le backend fait foi.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // Repli REST fiable (état initial + rafraîchissement) : le snapshot temps réel
  // peut arriver avant l'attachement des listeners. Les transitions WebSocket
  // (onlineUserIds) fournissent l'immédiateté.
  const [restOnline, setRestOnline] = useState(false);
  const otherParticipantId = otherParticipant?.id;
  useEffect(() => {
    // Reset systématique : sans lui, l'état « en ligne » du précédent
    // interlocuteur s'affiche sur le nouveau le temps du fetch.
    setRestOnline(false);
    if (!otherParticipantId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/chat/presence?userIds=${encodeURIComponent(otherParticipantId)}`,
          {
            credentials: 'include',
          },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setRestOnline(Boolean(data?.[otherParticipantId]));
      } catch {
        // Repli silencieux : les transitions temps réel prennent le relais.
      }
    };
    load();
    const intervalId = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [otherParticipantId]);

  const isUserOnline = otherParticipantId
    ? onlineUserIds.has(otherParticipantId) || restOnline
    : false;
  const displayName = conversation?.name || advisorName || t('display.advisorDefaultName');
  const displayRole = isGroupChat
    ? t('display.groupMembers', { count: conversation?.participants?.length || 0 })
    : advisorRole || t('display.advisorDefaultRole');
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <div
      className={`relative flex-1 min-h-0 flex flex-col ${isDark ? 'bg-surface-1' : 'bg-white'}`}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => {
        if (hasFiles(e)) e.preventDefault();
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDraggingFile && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface-0/70 backdrop-blur-sm pointer-events-none">
          <div className="rounded-xl border-2 border-dashed border-primary/60 bg-primary/10 px-8 py-6 text-center">
            <p className="text-sm font-medium text-tertiary">{t('display.composer.dropHint')}</p>
          </div>
        </div>
      )}

      {/* Header de conversation — reste visible, seule la zone de messages scrolle */}
      <div
        className={`shrink-0 flex items-center justify-between px-6 py-4 border-b ${
          isDark
            ? 'border-edge bg-surface-2'
            : 'border-gray-200 bg-linear-to-r from-teal-50 to-blue-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary ring-1 ring-white/10 flex items-center justify-center text-white font-semibold">
            {firstLetter}
          </div>
          <div>
            <h3 className={`font-semibold text-lg ${isDark ? 'text-fg' : 'text-gray-900'}`}>
              {displayName}
            </h3>
            <div className="flex items-center gap-2">
              {!isGroupChat && (
                <div
                  className={`h-2 w-2 rounded-full ${isUserOnline ? 'bg-tertiary' : 'bg-fg-subtle'}`}
                />
              )}
              <p className={`text-sm ${isDark ? 'text-fg-muted' : 'text-gray-600'}`}>
                {displayRole}{' '}
                {!isGroupChat && `• ${isUserOnline ? t('display.online') : t('display.offline')}`}
              </p>
            </div>
          </div>
        </div>
        {!isConnected && (
          <div
            className={`text-sm px-3 py-1 rounded-full ${
              isDark ? 'text-warning bg-yellow-900/30' : 'text-yellow-600 bg-yellow-50'
            }`}
          >
            {t('display.reconnecting')}
          </div>
        )}
      </div>

      {/* Zone de messages — seule partie scrollable */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 min-h-0 overflow-y-auto scrollbar-slim p-6 space-y-4 ${
          isDark ? 'bg-surface-1' : 'bg-gray-50'
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className={`text-center ${isDark ? 'text-fg-muted' : 'text-gray-500'}`}>
              <svg
                className={`mx-auto h-12 w-12 mb-3 ${isDark ? 'text-fg-muted' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className={`text-sm font-medium ${isDark ? 'text-fg-secondary' : ''}`}>
                {t('display.empty.title')}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-fg-muted' : 'text-gray-400'}`}>
                {t('display.empty.subtitle')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isDirector = senderRoles[msg.senderId] === 'DIRECTOR';
              const senderName = senderNames[msg.senderId];
              const isOwnMessage = msg.senderId === userId;
              const { text, attachments } = parseMessageContent(msg.content);

              const key =
                msg.messageId ||
                `${msg.conversationId}:${msg.senderId}:${msg.createdAt ?? 'no-date'}:${idx}`;

              // Message porteur d'une demande de bannissement : carte
              // structurée à la place de la bulle standard.
              const banRequest = msg.messageId
                ? banRequestsByMessage.get(msg.messageId)
                : undefined;
              if (banRequest) {
                return (
                  <div
                    key={key}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <BanRequestMessageCard
                      request={banRequest}
                      attachments={attachments}
                      renderAttachment={(attachment, attIdx) => (
                        <AttachmentView
                          key={`${key}:att:${attIdx}`}
                          attachment={attachment}
                          isOwnMessage={false}
                          isDark={isDark}
                          imageAlt={t('display.attachment.imageAlt')}
                        />
                      )}
                      isDark={isDark}
                      onDecided={() => void loadBanRequests()}
                    />
                  </div>
                );
              }

              return (
                <div key={key} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div>
                    {isGroupChat && !isOwnMessage && senderName && (
                      <p
                        className={`text-xs font-semibold mb-1 ml-1 ${isDark ? 'text-fg-muted' : 'text-gray-600'}`}
                      >
                        {senderName} {isDirector && '👑'}
                      </p>
                    )}
                    <div
                      className={`max-w-xs sm:max-w-sm px-4 py-3 rounded-lg ${
                        isOwnMessage
                          ? 'bg-primary text-white rounded-br-none'
                          : isDirector
                            ? 'bg-red-500 text-white rounded-bl-none'
                            : isDark
                              ? 'bg-surface-2 text-fg rounded-bl-none border border-edge-strong'
                              : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                      }`}
                    >
                      {attachments.length > 0 && (
                        <div className={`space-y-2 ${text ? 'mb-2' : ''}`}>
                          {attachments.map((attachment, attIdx) => (
                            <AttachmentView
                              key={`${key}:att:${attIdx}`}
                              attachment={attachment}
                              isOwnMessage={isOwnMessage || isDirector}
                              isDark={isDark}
                              imageAlt={t('display.attachment.imageAlt')}
                            />
                          ))}
                        </div>
                      )}
                      {text && (
                        <p className="text-sm whitespace-pre-wrap wrap-break-word">{text}</p>
                      )}
                      <p
                        className={`text-xs ${
                          isOwnMessage || isDirector
                            ? 'text-opacity-75'
                            : isDark
                              ? 'text-fg-muted'
                              : 'text-gray-500'
                        } mt-1`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString(locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {typingUsers.length > 0 && typingUsers[0] !== userId && (
              <div className="flex justify-start">
                <div
                  className={`px-4 py-3 rounded-lg rounded-bl-none ${
                    isDark
                      ? 'bg-surface-2 text-fg border border-edge-strong'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="flex gap-2">
                    <div
                      className={`h-2 w-2 rounded-full animate-bounce ${isDark ? 'bg-fg-subtle' : 'bg-gray-400'}`}
                    />
                    <div
                      className={`h-2 w-2 rounded-full animate-bounce ${isDark ? 'bg-fg-subtle' : 'bg-gray-400'}`}
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className={`h-2 w-2 rounded-full animate-bounce ${isDark ? 'bg-fg-subtle' : 'bg-gray-400'}`}
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Barre de saisie — reste accessible en bas ; remplacée par un bandeau
          si la conversation est gelée (relation advisor-client retirée). */}
      <div className="shrink-0">
        {isWritable ? (
          <MessageComposer
            ref={composerRef}
            disabled={!isConnected}
            onSendMessage={sendMessage}
            onTypingStart={startTyping}
            onTypingStop={stopTyping}
          />
        ) : (
          <div
            className={`border-t px-6 py-4 text-center text-sm ${
              isDark
                ? 'border-edge bg-surface-2 text-fg-muted'
                : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}
          >
            {t('display.lockedConversation')}
          </div>
        )}
      </div>
    </div>
  );
}
