'use client';

import { useState, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Conversation, useConversations } from '@/hooks/useConversations';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

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
    <div className={`flex flex-col h-full border-r ${
      theme === 'dark'
        ? 'bg-gray-900 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      <div className={`p-4 border-b ${
        theme === 'dark'
          ? 'border-gray-700'
          : 'border-gray-200'
      }`}>
        <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{t('list.title')}</h2>
        <div className="relative">
          <svg
            className={`absolute left-3 top-3 h-5 w-5 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}
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
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-500'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('list.loading')}</p>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className={`flex items-center justify-center h-full text-center p-4 ${
            theme === 'dark'
              ? 'text-gray-400'
              : 'text-gray-500'
          }`}>
            <div>
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
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                {searchQuery ? t('list.emptySearch') : t('list.empty')}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`text-sm mt-2 underline ${
                    theme === 'dark'
                      ? 'text-teal-400 hover:text-teal-300'
                      : 'text-teal-600 hover:text-teal-700'
                  }`}
                >
                  {t('list.clearSearch')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <nav className={`divide-y ${
            theme === 'dark'
              ? 'divide-gray-700'
              : 'divide-gray-200'
          }`}>
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full text-left p-4 transition-colors border-l-4 ${
                  selectedConversationId === conversation.id
                    ? theme === 'dark'
                      ? 'bg-teal-900/30 border-teal-500'
                      : 'bg-teal-50 border-teal-600'
                    : theme === 'dark'
                      ? 'border-transparent hover:bg-gray-800'
                      : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate text-sm ${
                      theme === 'dark'
                        ? 'text-gray-100'
                        : 'text-gray-900'
                    }`}>
                      {conversation.name}
                    </h3>
                    {conversation.description && (
                      <p className={`text-xs truncate mt-1 ${
                        theme === 'dark'
                          ? 'text-gray-400'
                          : 'text-gray-600'
                      }`}>
                        {conversation.description}
                      </p>
                    )}
                    {conversation.lastMessage && (
                      <p className={`text-xs truncate mt-1 ${
                        theme === 'dark'
                          ? 'text-gray-500'
                          : 'text-gray-500'
                      }`}>
                        {conversation.lastMessage}
                      </p>
                    )}
                  </div>
                  {conversation.lastMessageDate && (
                    <span className={`text-xs whitespace-nowrap flex-shrink-0 ${
                      theme === 'dark'
                        ? 'text-gray-500'
                        : 'text-gray-500'
                    }`}>
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
