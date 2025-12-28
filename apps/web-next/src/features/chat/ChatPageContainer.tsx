'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCreateConversation, useConversationsList } from '@/features/chat/use-cases';
import { useClientAdvisor, useAdvisorClients, useUsersByRole } from '@/features/chat/hooks';
import { ConversationData } from '@/lib/cache/conversations';
import ChatPagePresenter from './ChatPagePresenter';

interface ChatPageContainerProps {
  locale: string;
  initialConversations: ConversationData[];
}


export default function ChatPageContainer({
  locale,
  initialConversations,
}: ChatPageContainerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: userLoading } = useAuth();

  const {
    conversations,
    hasPrivateConversationWith,
    openConversationWith,
    updateConversations,
  } = useConversationsList(initialConversations);

  const { createPrivateConversation, isSubmitting, error: createError } =
    useCreateConversation({
      onSuccess: (conversationId) => {
        const url = new URL(window.location.href);
        url.searchParams.set('conversationId', conversationId);
        router.replace(url.pathname + '?' + url.searchParams.toString());
      },
    });

  const { advisor } = useClientAdvisor(
    user?.roles?.includes('CLIENT') ? user?.id : undefined
  );
  const { clients: advisorClients } = useAdvisorClients(
    user?.roles?.includes('ADVISOR') ? user?.id : undefined
  );
  const { users: directorUsers } = useUsersByRole(
    user?.roles?.includes('DIRECTOR') ? ('CLIENT' as const) : null
  );
  const { users: directorAdvisors } = useUsersByRole(
    user?.roles?.includes('DIRECTOR') ? ('ADVISOR' as const) : null
  );

  const conversationId = searchParams.get('conversationId') || '';
  const isDirector = user?.roles?.includes('DIRECTOR') ?? false;
  const isAdvisor = user?.roles?.includes('ADVISOR') ?? false;
  const isClient = user?.roles?.includes('CLIENT') ?? false;

  useEffect(() => {
    if (!user?.id) return;
    const loadConversations = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/by-user/${user.id}`,
          {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }
        );
        if (res.ok) {
          const list = await res.json();
          updateConversations(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        console.error('Failed to load conversations', e);
      }
    };
    loadConversations();
  }, [user?.id, updateConversations]);

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
    [router]
  );

  const handleCreateConversation = useCallback(
    async (targetUserId: string) => {
      const convId = await createPrivateConversation(targetUserId, user?.id || '');
      if (convId) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/by-user/${user?.id}`,
          { credentials: 'include' }
        );
        if (res.ok) {
          const newConversations = await res.json();
          updateConversations(Array.isArray(newConversations) ? newConversations : []);
        }
      }
    },
    [createPrivateConversation, user?.id, updateConversations]
  );

  const clientsList = isDirector
    ? [...(Array.isArray(directorUsers) ? directorUsers : []),
       ...(Array.isArray(directorAdvisors) ? directorAdvisors : [])]
    : isAdvisor
      ? advisorClients
      : [];

  const isLoading = userLoading;

  return (
    <ChatPagePresenter
      locale={locale}
      isLoading={isLoading}
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
    />
  );
}
