'use client';

import { useState, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Conversation, useConversations } from '@/features/chat/useConversations';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { formatMessagePreview } from '@/features/chat/attachments';

interface ConversationsListProps {
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  conversations?: Conversation[];
  loadingOverride?: boolean;
}

export default function ConversationsList({
  selectedConversationId,
  onSelectConversation,
  conversations: conversationsProp,
  loadingOverride,
}: ConversationsListProps) {
  const { theme } = useTheme();
  const t = useTranslations('chat');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const { conversations: fetchedConversations, isLoading: hookLoading } = useConversations();
  const conversations = conversationsProp ?? fetchedConversations;
  const isLoading = loadingOverride ?? hookLoading;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const searchLower = searchQuery.toLowerCase();
      const nameMatches = conv.name.toLowerCase().includes(searchLower);
      const descMatches = conv.description?.toLowerCase().includes(searchLower);
      return nameMatches || descMatches;
    });
  }, [conversations, searchQuery]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes === 0
        ? t('list.relative.justNow')
        : t('list.relative.minutesAgo', { count: diffInMinutes });
    }
    if (diffInHours < 24) {
      return t('list.relative.hoursAgo', { count: Math.floor(diffInHours) });
    }
    if (diffInHours < 48) {
      return t('list.relative.yesterday');
    }
    return date.toLocaleDateString(locale);
  };

  return (
    <div
      className={`flex flex-col h-full border-r ${
        theme === 'dark' ? 'bg-surface-1 border-white/5' : 'bg-white border-gray-200'
      }`}
    >
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
        <h2
          className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
        >
          {t('list.title')}
        </h2>
        <div className="relative">
          <svg
            className={`absolute left-3 top-3 h-5 w-5 ${theme === 'dark' ? 'text-fg-muted' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder={t('list.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm ${
              theme === 'dark'
                ? 'border-white/10 bg-surface-2 text-white placeholder:text-fg-subtle'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className={`text-sm ${theme === 'dark' ? 'text-fg-muted' : 'text-gray-600'}`}>
                {t('list.loading')}
              </p>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div
            className={`flex items-center justify-center h-full text-center p-4 ${
              theme === 'dark' ? 'text-fg-muted' : 'text-gray-500'
            }`}
          >
            <div>
              <svg
                className={`mx-auto h-12 w-12 mb-3 ${theme === 'dark' ? 'text-fg-muted' : 'text-gray-400'}`}
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
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-fg-secondary' : ''}`}>
                {searchQuery ? t('list.emptySearch') : t('list.empty')}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`text-sm mt-2 underline ${
                    theme === 'dark'
                      ? 'text-tertiary hover:text-teal-300'
                      : 'text-teal-600 hover:text-teal-700'
                  }`}
                >
                  {t('list.clearSearch')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <nav className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-gray-200'}`}>
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full text-left p-4 transition-colors border-l-4 ${
                  selectedConversationId === conversation.id
                    ? theme === 'dark'
                      ? 'bg-primary/15 border-primary'
                      : 'bg-teal-50 border-teal-600'
                    : theme === 'dark'
                      ? 'border-transparent hover:bg-white/5'
                      : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-medium truncate text-sm ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {conversation.name}
                    </h3>
                    {conversation.description && (
                      <p
                        className={`text-xs truncate mt-1 ${
                          theme === 'dark' ? 'text-fg-muted' : 'text-gray-600'
                        }`}
                      >
                        {conversation.description}
                      </p>
                    )}
                    {conversation.lastMessage && (
                      <p
                        className={`text-xs truncate mt-1 ${
                          theme === 'dark' ? 'text-fg-subtle' : 'text-gray-500'
                        }`}
                      >
                        {formatMessagePreview(conversation.lastMessage, {
                          image: t('list.preview.image'),
                          file: t('list.preview.file'),
                        })}
                      </p>
                    )}
                  </div>
                  {conversation.lastMessageDate && (
                    <span
                      className={`text-xs whitespace-nowrap shrink-0 ${
                        theme === 'dark' ? 'text-fg-subtle' : 'text-gray-500'
                      }`}
                    >
                      {formatDate(conversation.lastMessageDate)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
