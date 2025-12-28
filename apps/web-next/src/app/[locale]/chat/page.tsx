import { ChatWrapper } from '@/components/templates/ChatWrapper';
import type { ConversationData } from '@/lib/cache/conversations';

type ChatPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { locale } = await params;
  const initialConversations: ConversationData[] = [];

  return (
    <ChatWrapper 
      locale={locale} 
      initialConversations={initialConversations}
    />
  );
}
