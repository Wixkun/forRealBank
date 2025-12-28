'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from 'next-intl';
import { ChatHeader } from '@/components/organisms/ChatHeader';
import ConversationsList from '@/components/chat/ConversationsList';
import ChatDisplay from '@/components/chat/ChatDisplay';
import { ConversationData } from '@/lib/cache/conversations';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  roles?: string[];
}

interface ChatPagePresenterProps {
  locale: string;
  isLoading: boolean;
  user: User | null;
  conversations: ConversationData[];
  conversationId: string;
  onSelectConversation: (id: string) => void;
  onCreateConversation: (targetUserId: string) => Promise<void>;
  isSubmitting: boolean;
  createError: string | null;
  advisor: User | null;
  clientsList: User[];
  hasPrivateConversationWith: (targetUserId: string) => boolean;
  openConversationWith: (targetUserId: string) => string | null;
  isClient: boolean;
  isAdvisor: boolean;
  isDirector: boolean;
}

export default function ChatPagePresenter({
  locale,
  isLoading,
  user,
  conversations,
  conversationId,
  onSelectConversation,
  onCreateConversation,
  isSubmitting,
  createError,
  advisor,
  clientsList,
  hasPrivateConversationWith,
  openConversationWith,
  isClient,
  isAdvisor,
  isDirector,
}: ChatPagePresenterProps) {
  const { theme } = useTheme();
  const t = useTranslations('chat');

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900'
            : 'bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50'
        }`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            {t('loadingConversations')}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900'
            : 'bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50'
        }`}
      >
        <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
          {t('loginRequired')}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900'
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50'
      }`}
    >
      <ChatHeader userName={user.firstName} />

      <main className="flex-1 px-6 py-6 overflow-hidden">
        <div
          className={`rounded-lg shadow-lg overflow-hidden flex h-full ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <div
            className={`w-80 flex-shrink-0 border-r ${
              theme === 'dark'
                ? 'bg-gray-900 border-gray-700'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <ConversationsList
              selectedConversationId={conversationId}
              onSelectConversation={onSelectConversation}
              conversations={conversations}
              loadingOverride={false}
            />
          </div>

          <div
            className={`flex-1 flex flex-col ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {(isAdvisor || isDirector) && (
              <div
                className={`p-4 border-b flex flex-col gap-2 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                      }`}
                    >
                      {isDirector ? t('directorSectionTitle') : t('advisorSectionTitle')}
                    </p>
                    <p
                      className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {t('createPrivateHint')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {clientsList.map((client) => {
                    const already = hasPrivateConversationWith(client.id);
                    const existingConvId = openConversationWith(client.id);
                    return (
                      <button
                        key={client.id}
                        onClick={() =>
                          already && existingConvId
                            ? onSelectConversation(existingConvId)
                            : onCreateConversation(client.id)
                        }
                        disabled={isSubmitting}
                        className={`px-3 py-2 rounded-lg text-sm border transition ${
                          already
                            ? theme === 'dark'
                              ? 'bg-gray-600 text-gray-200 border-gray-500 hover:bg-gray-500'
                              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            : theme === 'dark'
                              ? 'bg-teal-900/40 text-teal-200 border-teal-700 hover:bg-teal-900/60'
                              : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                        }`}
                      >
                        {client.firstName} {client.lastName}{' '}
                        {already ? t('alreadyCreatedSuffix') : ''}
                      </button>
                    );
                  })}
                  {clientsList.length === 0 && (
                    <span
                      className={`text-sm ${
                        theme === 'dark'
                          ? 'text-gray-400'
                          : 'text-gray-500'
                      }`}
                    >
                      {t('noneAvailable')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {isClient && advisor && !hasPrivateConversationWith(advisor.id) && (
              <div
                className={`p-4 border-b ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <button
                  onClick={() => onCreateConversation(advisor.id)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isSubmitting ? t('creating') : t('contactAdvisor')}
                </button>
                {createError && (
                  <p className="text-sm text-red-500 mt-2">{createError}</p>
                )}
              </div>
            )}

            {conversationId && conversations.length > 0 ? (
              <ChatDisplay
                conversationId={conversationId}
                userId={user.id}
                conversation={conversations.find((c) => c.id === conversationId)}
              />
            ) : conversations.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div
                  className={`text-center ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  <svg
                    className={`mx-auto h-12 w-12 mb-3 ${
                      theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                    }`}
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
                  <h3
                    className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                    }`}
                  >
                    {t('noConversationsTitle')}
                  </h3>
                  <p
                    className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {t('noConversationsDescription')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div
                  className={`text-center ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  <svg
                    className={`mx-auto h-12 w-12 mb-3 ${
                      theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm">{t('selectConversation')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
