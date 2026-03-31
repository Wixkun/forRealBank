'use client';

import ChatPageContainer from '@/features/chat/ChatPageContainer';
import { ConversationData } from '@/lib/cache/conversations';

interface ChatContentProps {
  initialConversations: ConversationData[];
}

export default function ChatContent({ initialConversations }: ChatContentProps) {
  return <ChatPageContainer initialConversations={initialConversations} />;
}
