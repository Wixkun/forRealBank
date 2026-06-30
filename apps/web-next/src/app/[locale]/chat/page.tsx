import { ChatWrapper } from '@/features/chat/components/ChatWrapper';

type ChatPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  await params;
  return <ChatWrapper initialConversations={[]} />;
}
