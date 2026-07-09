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
      {/* Hors du shell dashboard, la page doit fournir elle-même sa hauteur :
          le présentateur est en h-full et suppose un parent dimensionné. */}
      <div className="h-dvh">
        <ChatPage initialConversations={initialConversations} />
      </div>
    </ThemeProvider>
  );
}
