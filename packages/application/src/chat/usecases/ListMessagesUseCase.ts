import { IMessageRepository } from '@forreal/domain/chat/ports/IMessageRepository';

export class ListMessagesUseCase {
  constructor(private readonly messageRepository: IMessageRepository) {}

  async execute(input: { conversationId: string; limit?: number; offset?: number }) {
    const messages = await this.messageRepository.listByConversation(input.conversationId, {
      limit: input.limit,
      offset: input.offset,
    });
    return messages.map(m => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt,
      readAt: m.readAt,
    }));
  }
}
