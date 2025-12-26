import { IConversationRepository } from '@forreal/domain/chat/ports/IConversationRepository';
import { ConversationType } from '@forreal/domain/chat/Conversation';

export class CreateConversationUseCase {
  constructor(private readonly conversationRepository: IConversationRepository) {}

  async execute(input: { type: ConversationType }) {
    const conversation = await this.conversationRepository.create(input.type);
    return { conversationId: conversation.id, type: conversation.type, createdAt: conversation.createdAt };
  }
}
