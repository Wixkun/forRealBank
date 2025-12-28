'use client';

import ChatPageContainer from '@/features/chat/ChatPageContainer';
import { ConversationData } from '@/lib/cache/conversations';

interface ChatContentProps {
  locale: string;
  initialConversations: ConversationData[];
}

export default function ChatContent({
  locale,
  initialConversations,
}: ChatContentProps) {
  return (
    <ChatPageContainer
      locale={locale}
      initialConversations={initialConversations}
    />
  );
}
