'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from 'next-intl';
import ConversationsList from '@/features/chat/components/ConversationsList';
import ChatDisplay from '@/features/chat/components/ChatDisplay';
import NewGroupModal from '@/features/chat/components/NewGroupModal';
import UserDirectoryPanel from '@/features/chat/components/UserDirectoryPanel';
import { Conversation } from '@/features/chat/useConversations';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  roles?: string[];
}

interface GroupCandidate {
  id: string;
  firstName: string;
  lastName: string;
}

interface ChatPagePresenterProps {
  isLoading: boolean;
  user: User | null;
  conversations: Conversation[];
  conversationId: string;
  onSelectConversation: (id: string) => void;
  onOpenContact: (targetUserId: string) => void | Promise<void>;
  isOpeningContact: boolean;
  // CLIENT uniquement : conseiller attitré (bouton « Contacter mon
  // conseiller » dans l'état vide) ; null = aucun conseiller attribué.
  isClient: boolean;
  clientAdvisor: { id: string; firstName: string; lastName: string } | null;
  isAdvisorLoading: boolean;
  onToggleMute: (conversationId: string, currentlyMuted: boolean) => void | Promise<void>;
  onHideConversation: (conversationId: string) => void | Promise<void>;
  // Colonne « Clients et conseillers » : réservée aux rôles qui initient des
  // conversations (advisor / director) — cachée pour un client.
  showDirectory: boolean;
  canCreateGroup: boolean;
  groupCandidates: GroupCandidate[];
  isGroupModalOpen: boolean;
  onOpenGroupModal: () => void;
  onCloseGroupModal: () => void;
  onCreateGroup: (name: string, participantIds: string[]) => Promise<void>;
}

function EmptyState({
  isDark,
  title,
  subtitle,
}: {
  isDark: boolean;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className={`text-center ${isDark ? 'text-fg-muted' : 'text-gray-500'}`}>
        <svg
          className={`mx-auto h-12 w-12 mb-3 ${isDark ? 'text-fg-muted' : 'text-gray-400'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h3 className={`text-sm font-medium ${isDark ? 'text-fg' : 'text-gray-900'}`}>{title}</h3>
        {subtitle && (
          <p className={`text-sm mt-1 ${isDark ? 'text-fg-muted' : 'text-gray-500'}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Page Messages en trois colonnes :
 * [ Conversations ] [ Conversation active ] [ Clients et conseillers ]
 * La colonne centrale reste la plus large ; sur écrans étroits, les colonnes
 * latérales deviennent des panneaux (drawers) superposés, fermables au clavier.
 */
export default function ChatPagePresenter({
  isLoading,
  user,
  conversations,
  conversationId,
  onSelectConversation,
  onOpenContact,
  isOpeningContact,
  isClient,
  clientAdvisor,
  isAdvisorLoading,
  onToggleMute,
  onHideConversation,
  showDirectory,
  canCreateGroup,
  groupCandidates,
  isGroupModalOpen,
  onOpenGroupModal,
  onCloseGroupModal,
  onCreateGroup,
}: ChatPagePresenterProps) {
  const { theme } = useTheme();
  const t = useTranslations('chat');
  const isDark = theme === 'dark';

  // Drawers responsive (liste à gauche < md, annuaire à droite < xl).
  const [isListDrawerOpen, setListDrawerOpen] = useState(false);
  const [isDirectoryDrawerOpen, setDirectoryDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isListDrawerOpen && !isDirectoryDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setListDrawerOpen(false);
        setDirectoryDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isListDrawerOpen, isDirectoryDrawerOpen]);

  // Une sélection masquée / disparue de la liste ne doit jamais rester affichée.
  const selectedConversation = conversations.find((c) => c.id === conversationId);

  if (isLoading) {
    return (
      <div
        className={`h-full flex items-center justify-center ${isDark ? 'bg-surface-0' : 'bg-gray-50'}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className={isDark ? 'text-fg-muted' : 'text-gray-600'}>{t('loadingConversations')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={`h-full flex items-center justify-center ${isDark ? 'bg-surface-0' : 'bg-gray-50'}`}
      >
        <div className={`text-center ${isDark ? 'text-fg-muted' : 'text-gray-700'}`}>
          {t('loginRequired')}
        </div>
      </div>
    );
  }

  const conversationsColumn = (
    <ConversationsList
      selectedConversationId={conversationId}
      onSelectConversation={(id) => {
        setListDrawerOpen(false);
        onSelectConversation(id);
      }}
      conversations={conversations}
      loadingOverride={false}
      onToggleMute={onToggleMute}
      onHideConversation={onHideConversation}
      canCreateGroup={canCreateGroup}
      onCreateGroup={onOpenGroupModal}
    />
  );

  const directoryColumn = (
    <UserDirectoryPanel
      onOpenContact={async (targetUserId) => {
        setDirectoryDrawerOpen(false);
        await onOpenContact(targetUserId);
      }}
      isOpening={isOpeningContact}
    />
  );

  return (
    // h-full (et non min-h-screen) : la page occupe exactement la hauteur
    // disponible dans le shell, seuls les blocs internes scrollent.
    <div className={`h-full min-h-0 flex flex-col ${isDark ? 'bg-surface-0' : 'bg-gray-50'}`}>
      <main className="flex-1 min-h-0 overflow-hidden">
        <div
          className={`relative rounded-lg shadow-lg overflow-hidden flex h-full min-h-0 border ${
            isDark ? 'bg-surface-1 border-edge' : 'bg-white border-transparent'
          }`}
        >
          {/* ── Colonne gauche : conversations (drawer < md) ─────────────── */}
          <div
            className={`hidden md:flex w-72 xl:w-80 shrink-0 flex-col min-h-0 border-r ${
              isDark ? 'border-edge' : 'border-gray-200'
            }`}
          >
            {conversationsColumn}
          </div>

          {/* ── Colonne centrale : conversation active ───────────────────── */}
          <div
            className={`flex-1 min-w-0 min-h-0 flex flex-col ${isDark ? 'bg-surface-1' : 'bg-white'}`}
          >
            {/* Barre d'accès aux panneaux latéraux sur écrans étroits. */}
            <div
              className={`flex md:hidden xl:hidden items-center justify-between gap-2 border-b px-3 py-2 md:justify-end ${
                isDark ? 'border-edge' : 'border-gray-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setListDrawerOpen(true)}
                aria-expanded={isListDrawerOpen}
                className={`md:hidden rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                  isDark
                    ? 'border-edge-strong text-fg-secondary hover:bg-hover'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('list.title')}
              </button>
              {showDirectory && (
                <button
                  type="button"
                  onClick={() => setDirectoryDrawerOpen(true)}
                  aria-expanded={isDirectoryDrawerOpen}
                  className={`xl:hidden rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                    isDark
                      ? 'border-edge-strong text-fg-secondary hover:bg-hover'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t('directory.title')}
                </button>
              )}
            </div>
            {/* Même barre pour la plage md → xl (annuaire seulement). */}
            {showDirectory && (
              <div
                className={`hidden md:flex xl:hidden items-center justify-end gap-2 border-b px-3 py-2 ${
                  isDark ? 'border-edge' : 'border-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setDirectoryDrawerOpen(true)}
                  aria-expanded={isDirectoryDrawerOpen}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                    isDark
                      ? 'border-edge-strong text-fg-secondary hover:bg-hover'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t('directory.title')}
                </button>
              </div>
            )}

            {selectedConversation ? (
              <ChatDisplay
                conversationId={selectedConversation.id}
                userId={user.id}
                conversation={selectedConversation}
              />
            ) : conversations.length === 0 ? (
              <div className="flex-1 flex flex-col">
                <EmptyState
                  isDark={isDark}
                  title={t('noConversationsTitle')}
                  subtitle={
                    isClient && clientAdvisor
                      ? t('emptyClient.hint', {
                          name: `${clientAdvisor.firstName} ${clientAdvisor.lastName}`,
                        })
                      : t('noConversationsDescription')
                  }
                />
                {/* CLIENT sans conversation : premier contact avec son
                    conseiller attitré (le backend déduplique les privées). */}
                {isClient && !isAdvisorLoading && (
                  <div className="pb-10 text-center">
                    {clientAdvisor ? (
                      <button
                        type="button"
                        onClick={() => void onOpenContact(clientAdvisor.id)}
                        disabled={isOpeningContact}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      >
                        {isOpeningContact
                          ? t('emptyClient.opening')
                          : t('emptyClient.contactAdvisor')}
                      </button>
                    ) : (
                      <p className={`text-sm ${isDark ? 'text-fg-muted' : 'text-gray-500'}`}>
                        {t('emptyClient.noAdvisor')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState isDark={isDark} title={t('selectConversation')} />
            )}
          </div>

          {/* ── Colonne droite : annuaire (drawer < xl) ──────────────────── */}
          {showDirectory && (
            <div
              className={`hidden xl:flex w-72 shrink-0 flex-col min-h-0 border-l ${
                isDark ? 'border-edge' : 'border-gray-200'
              }`}
            >
              {directoryColumn}
            </div>
          )}

          {/* ── Drawers superposés (écrans étroits) ──────────────────────── */}
          {isListDrawerOpen && (
            <div className="absolute inset-0 z-30 flex md:hidden">
              <div
                className={`w-80 max-w-[85%] h-full min-h-0 flex flex-col shadow-xl ${
                  isDark ? 'bg-surface-1' : 'bg-white'
                }`}
              >
                {conversationsColumn}
              </div>
              <button
                type="button"
                aria-label={t('closePanel')}
                onClick={() => setListDrawerOpen(false)}
                className="flex-1 bg-black/50"
              />
            </div>
          )}
          {showDirectory && isDirectoryDrawerOpen && (
            <div className="absolute inset-0 z-30 flex xl:hidden">
              <button
                type="button"
                aria-label={t('closePanel')}
                onClick={() => setDirectoryDrawerOpen(false)}
                className="flex-1 bg-black/50"
              />
              <div
                className={`w-80 max-w-[85%] h-full min-h-0 flex flex-col shadow-xl ${
                  isDark ? 'bg-surface-1' : 'bg-white'
                }`}
              >
                {directoryColumn}
              </div>
            </div>
          )}
        </div>
      </main>

      <NewGroupModal
        open={isGroupModalOpen}
        candidates={groupCandidates}
        onClose={onCloseGroupModal}
        onCreate={onCreateGroup}
      />
    </div>
  );
}
