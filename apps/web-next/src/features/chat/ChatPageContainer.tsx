'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCreateConversation, useConversationsList } from '@/features/chat/use-cases';
import { useClientAdvisor, useAdvisorClients, useUsersByRole } from '@/features/chat/hooks';
import { ConversationData } from '@/lib/cache/conversations';
import { onChatEvent, emitChatEvent } from '@/features/chat/chat-events';
import ChatPagePresenter from './ChatPagePresenter';

interface ChatPageContainerProps {
  initialConversations: ConversationData[];
}

export default function ChatPageContainer({ initialConversations }: ChatPageContainerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: userLoading } = useAuth();

  const { conversations, hasPrivateConversationWith, openConversationWith, updateConversations } =
    useConversationsList(initialConversations);

  const {
    createPrivateConversation,
    isSubmitting,
    error: createError,
  } = useCreateConversation({
    onSuccess: (conversationId) => {
      const url = new URL(window.location.href);
      url.searchParams.set('conversationId', conversationId);
      router.replace(url.pathname + '?' + url.searchParams.toString());
    },
  });

  const { advisor } = useClientAdvisor(user?.roles?.includes('CLIENT') ? user?.id : undefined);
  const { clients: advisorClients } = useAdvisorClients(
    user?.roles?.includes('ADVISOR') ? user?.id : undefined,
  );
  const { users: directorUsers } = useUsersByRole(
    user?.roles?.includes('DIRECTOR') ? ('CLIENT' as const) : null,
  );
  const { users: directorAdvisors } = useUsersByRole(
    user?.roles?.includes('DIRECTOR') ? ('ADVISOR' as const) : null,
  );

  const conversationId = searchParams.get('conversationId') || '';
  const isDirector = user?.roles?.includes('DIRECTOR') ?? false;
  const isAdvisor = user?.roles?.includes('ADVISOR') ?? false;
  const isClient = user?.roles?.includes('CLIENT') ?? false;
  const canCreateGroup = isDirector || isAdvisor || (user?.roles?.includes('ADMIN') ?? false);

  const [isGroupModalOpen, setGroupModalOpen] = useState(false);

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

  // Rafraîchit la liste (badges non-lus) dès qu'une conversation est lue.
  useEffect(() => {
    return onChatEvent('chat:read', () => {
      void refreshConversations();
    });
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
      if (created?.conversationId) {
        const url = new URL(window.location.href);
        url.searchParams.set('conversationId', created.conversationId);
        router.replace(url.pathname + '?' + url.searchParams.toString());
      }
    },
    [refreshConversations, router],
  );

  useEffect(() => {
    if (!user || conversationId || conversations.length === 0) return;
    const firstConv = conversations[0];
    if (firstConv) {
      const url = new URL(window.location.href);
      url.searchParams.set('conversationId', firstConv.id);
      router.replace(url.pathname + '?' + url.searchParams.toString());
    }
  }, [user, conversationId, conversations, router]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      const url = new URL(window.location.href);
      url.searchParams.set('conversationId', id);
      router.replace(url.pathname + '?' + url.searchParams.toString());
    },
    [router],
  );

  const handleCreateConversation = useCallback(
    async (targetUserId: string) => {
      const convId = await createPrivateConversation(targetUserId, user?.id || '');
      if (convId) {
        const res = await fetch(`/api/chat/conversations/by-user/${user?.id}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const newConversations = await res.json();
          updateConversations(Array.isArray(newConversations) ? newConversations : []);
        }
      }
    },
    [createPrivateConversation, user?.id, updateConversations],
  );

  const clientsList = isDirector
    ? [
        ...(Array.isArray(directorUsers) ? directorUsers : []),
        ...(Array.isArray(directorAdvisors) ? directorAdvisors : []),
      ]
    : isAdvisor
      ? advisorClients
      : [];

  return (
    <ChatPagePresenter
      isLoading={userLoading}
      user={user}
      conversations={conversations}
      conversationId={conversationId}
      onSelectConversation={handleSelectConversation}
      onCreateConversation={handleCreateConversation}
      isSubmitting={isSubmitting}
      createError={createError}
      advisor={advisor}
      clientsList={clientsList}
      hasPrivateConversationWith={hasPrivateConversationWith}
      openConversationWith={openConversationWith}
      isClient={isClient}
      isAdvisor={isAdvisor}
      isDirector={isDirector}
      onToggleMute={handleToggleMute}
      canCreateGroup={canCreateGroup}
      isGroupModalOpen={isGroupModalOpen}
      onOpenGroupModal={() => setGroupModalOpen(true)}
      onCloseGroupModal={() => setGroupModalOpen(false)}
      onCreateGroup={handleCreateGroup}
    />
  );
}
