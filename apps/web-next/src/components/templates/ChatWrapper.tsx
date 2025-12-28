'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import ChatPage from '@/app/[locale]/chat/ChatContent';
import { ConversationData } from '@/lib/cache/conversations';

type ChatWrapperProps = {
  locale: string;
  initialConversations?: ConversationData[];
};

export function ChatWrapper({ locale, initialConversations = [] }: ChatWrapperProps) {
  return (
    <ThemeProvider>
      <ChatPage locale={locale} initialConversations={initialConversations} />
    </ThemeProvider>
  );
}
