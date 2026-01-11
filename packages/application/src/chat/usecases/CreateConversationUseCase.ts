import { IConversationRepository } from '@forreal/domain';
import { ConversationType } from '@forreal/domain';

export class CreateConversationUseCase {
  constructor(private readonly conversationRepository: IConversationRepository) {}

  async execute(input: { type: ConversationType }) {
    const conversation = await this.conversationRepository.create(input.type);
    return { conversationId: conversation.id, type: conversation.type, createdAt: conversation.createdAt };
  }
}
