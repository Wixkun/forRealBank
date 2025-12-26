import { IMessageRepository } from '@forreal/domain/chat/ports/IMessageRepository';

export class SendMessageUseCase {
  constructor(private readonly messageRepository: IMessageRepository) {}

  async execute(input: { conversationId: string; senderId: string; content: string }) {
    const message = await this.messageRepository.create(input.conversationId, input.senderId, input.content);
    return {
      messageId: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
    };
  }
}
