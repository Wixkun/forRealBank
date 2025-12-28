'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/hooks/useChat';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

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

export default function ChatDisplay({
  conversationId,
  userId,
  conversation,
  advisorName,
  advisorRole,
}: ChatDisplayProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [senderNames, setSenderNames] = useState<{ [key: string]: string }>({});
  const [senderRoles, setSenderRoles] = useState<{ [key: string]: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { theme } = useTheme();
  const t = useTranslations('chat');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';

  const { messages, typingUsers, isConnected, presentUserIds, sendMessage, startTyping, stopTyping } = useChat({
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      startTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 1000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage(input);
    setInput('');
    setIsTyping(false);
    stopTyping();
  };

  const isUserOnline = presentUserIds.some((id) => id !== userId);
  const isGroupChat = conversation?.type === 'GROUP';
  const displayName = conversation?.name || advisorName || t('display.advisorDefaultName');
  const displayRole = isGroupChat
    ? t('display.groupMembers', { count: conversation?.participants?.length || 0 })
    : advisorRole || t('display.advisorDefaultRole');
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`flex items-center justify-between px-6 py-4 border-b ${
        theme === 'dark'
          ? 'border-gray-700 bg-gray-700'
          : 'border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50'
      }`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-semibold">
            {firstLetter}
          </div>
          <div>
            <h3 className={`font-semibold text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{displayName}</h3>
            <div className="flex items-center gap-2">
              {!isGroupChat && <div className={`h-2 w-2 rounded-full ${isUserOnline ? 'bg-green-500' : 'bg-gray-400'}`} />}
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {displayRole} {!isGroupChat && `• ${isUserOnline ? t('display.online') : t('display.offline')}`}
              </p>
            </div>
          </div>
        </div>
        {!isConnected && (
          <div className={`text-sm px-3 py-1 rounded-full ${
            theme === 'dark'
              ? 'text-yellow-400 bg-yellow-900/30'
              : 'text-yellow-600 bg-yellow-50'
          }`}>
            {t('display.reconnecting')}
          </div>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <svg
                className={`mx-auto h-12 w-12 mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}
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
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : ''}`}>{t('display.empty.title')}</p>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{t('display.empty.subtitle')}</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isDirector = senderRoles[msg.senderId] === 'DIRECTOR';
              const senderName = senderNames[msg.senderId];
              const isOwnMessage = msg.senderId === userId;

              return (
                <div key={msg.messageId} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div>
                    {isGroupChat && !isOwnMessage && senderName && (
                      <p className={`text-xs font-semibold mb-1 ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {senderName} {isDirector && '👑'}
                      </p>
                    )}
                    <div
                      className={`max-w-xs px-4 py-3 rounded-lg ${
                        isOwnMessage
                          ? 'bg-teal-500 text-white rounded-br-none'
                          : isDirector
                            ? 'bg-red-500 text-white rounded-bl-none'
                            : theme === 'dark'
                              ? 'bg-gray-700 text-gray-100 rounded-bl-none border border-gray-600'
                              : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-xs ${
                          isOwnMessage || isDirector ? 'text-opacity-75' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
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
                <div className={`px-4 py-3 rounded-lg rounded-bl-none ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-100 border border-gray-600'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  <div className="flex gap-2">
                    <div className={`h-2 w-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-gray-400'}`} />
                    <div className={`h-2 w-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-gray-400'}`} style={{ animationDelay: '0.1s' }} />
                    <div className={`h-2 w-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-gray-400'}`} style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSend} className={`px-6 py-4 border-t ${
        theme === 'dark'
          ? 'border-gray-700 bg-gray-800'
          : 'border-gray-200 bg-white'
      }`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={t('display.input.placeholder')}
            className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-500'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          />
          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {t('display.send')}
          </button>
        </div>
      </form>
    </div>
  );
}
