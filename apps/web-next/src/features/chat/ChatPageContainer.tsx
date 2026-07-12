'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOpenPrivateConversation, useConversationsList } from '@/features/chat/use-cases';
import { useContacts } from '@/features/chat/hooks';
import { onChatEvent, emitChatEvent } from '@/features/chat/chat-events';
import ChatPagePresenter from './ChatPagePresenter';

export default function ChatPageContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: userLoading } = useAuth();

  const { conversations, updateConversations } = useConversationsList([]);

  const conversationId = searchParams.get('conversationId') || '';
  const isAdvisor = user?.roles?.includes('ADVISOR') ?? false;
  const isDirector = user?.roles?.includes('DIRECTOR') ?? false;
  const isClient = user?.roles?.includes('CLIENT') ?? false;
  const canCreateGroup = isAdvisor || isDirector || (user?.roles?.includes('ADMIN') ?? false);
  // L'annuaire n'est utile qu'aux rôles qui initient des conversations : un
  // client échange avec son conseiller via ses conversations existantes.
  const showDirectory = isAdvisor || isDirector;

  const [isGroupModalOpen, setGroupModalOpen] = useState(false);

  // Même source filtrée par rôle côté serveur pour : les candidats de groupe
  // (advisor → ses clients) et le conseiller attitré d'un client (son seul
  // contact autorisé), utilisé par « Contacter mon conseiller ».
  const { contacts, isLoading: contactsLoading } = useContacts('');
  const clientAdvisor = isClient ? (contacts[0] ?? null) : null;

  const selectConversation = useCallback(
    (id: string | null) => {
      const url = new URL(window.location.href);
      if (id) url.searchParams.set('conversationId', id);
      else url.searchParams.delete('conversationId');
      router.replace(url.pathname + '?' + url.searchParams.toString());
    },
    [router],
  );

  const { openPrivateConversation, isSubmitting: isOpeningContact } = useOpenPrivateConversation({
    onSuccess: (newConversationId) => selectConversation(newConversationId),
  });

  const refreshConversations = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/chat/conversations/by-user/${user.id}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const list = await res.json();
        updateConversations(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  }, [user?.id, updateConversations]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Rafraîchit la liste quand une conversation est lue (badges non-lus) ou que
  // les conversations changent (groupe créé, nouveau message → une conversation
  // masquée peut réapparaître).
  useEffect(() => {
    const offRead = onChatEvent('chat:read', () => void refreshConversations());
    const offChanged = onChatEvent('chat:conversations-changed', () => void refreshConversations());
    return () => {
      offRead();
      offChanged();
    };
  }, [refreshConversations]);

  const handleToggleMute = useCallback(
    async (targetConversationId: string, currentlyMuted: boolean) => {
      const action = currentlyMuted ? 'unmute' : 'mute';
      try {
        const res = await fetch(
          `/api/chat/conversations/${targetConversationId}/notifications/${action}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          },
        );
        if (res.ok) await refreshConversations();
      } catch (e) {
        console.error('Failed to toggle mute', e);
      }
    },
    [refreshConversations],
  );

  // Masque la conversation pour l'utilisateur connecté uniquement (l'historique
  // et les autres participants sont intacts). Si c'est la conversation ouverte,
  // on bascule proprement sur la suivante visible (ou sur l'état vide).
  const handleHideConversation = useCallback(
    async (targetConversationId: string) => {
      try {
        const res = await fetch(`/api/chat/conversations/${targetConversationId}/hide`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return;
        if (targetConversationId === conversationId) {
          const next = conversations.find((c) => c.id !== targetConversationId);
          selectConversation(next?.id ?? null);
        }
        await refreshConversations();
      } catch (e) {
        console.error('Failed to hide conversation', e);
      }
    },
    [conversationId, conversations, refreshConversations, selectConversation],
  );

  const handleCreateGroup = useCallback(
    async (name: string, participantIds: string[]) => {
      const res = await fetch('/api/chat/groups', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, participantIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      const created = await res.json();
      setGroupModalOpen(false);
      emitChatEvent('chat:conversations-changed');
      await refreshConversations();
      if (created?.conversationId) selectConversation(created.conversationId);
    },
    [refreshConversations, selectConversation],
  );

  // Ouvre / rouvre la conversation privée avec un contact ; le backend
  // déduplique et démasque, puis on rafraîchit pour la voir dans la liste.
  const handleOpenContact = useCallback(
    async (targetUserId: string) => {
      const openedId = await openPrivateConversation(targetUserId);
      if (openedId) await refreshConversations();
    },
    [openPrivateConversation, refreshConversations],
  );

  // Sélection automatique de la première conversation visible.
  useEffect(() => {
    if (!user || conversationId || conversations.length === 0) return;
    const firstConv = conversations[0];
    if (firstConv) selectConversation(firstConv.id);
  }, [user, conversationId, conversations, selectConversation]);

  // Une sélection qui n'existe plus dans la liste (masquée ailleurs, retirée…)
  // est remplacée par la première visible : pas d'état incohérent au centre.
  useEffect(() => {
    if (!conversationId || conversations.length === 0) return;
    if (!conversations.some((c) => c.id === conversationId)) {
      selectConversation(conversations[0]?.id ?? null);
    }
  }, [conversationId, conversations, selectConversation]);

  return (
    <ChatPagePresenter
      isLoading={userLoading}
      user={user}
      conversations={conversations}
      conversationId={conversationId}
      onSelectConversation={selectConversation}
      onOpenContact={handleOpenContact}
      isOpeningContact={isOpeningContact}
      isClient={isClient}
      clientAdvisor={clientAdvisor}
      isAdvisorLoading={contactsLoading}
      onToggleMute={handleToggleMute}
      onHideConversation={handleHideConversation}
      showDirectory={showDirectory}
      canCreateGroup={canCreateGroup}
      groupCandidates={contacts}
      isGroupModalOpen={isGroupModalOpen}
      onOpenGroupModal={() => setGroupModalOpen(true)}
      onCloseGroupModal={() => setGroupModalOpen(false)}
      onCreateGroup={handleCreateGroup}
    />
  );
}
