'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import ChatPage from '@/app/[locale]/chat/ChatContent';
import { ConversationData } from '@/lib/cache/conversations';

type ChatWrapperProps = {
  initialConversations?: ConversationData[];
};

export function ChatWrapper({ initialConversations = [] }: ChatWrapperProps) {
  return (
    <ThemeProvider>
      <ChatPage initialConversations={initialConversations} />
    </ThemeProvider>
  );
}
