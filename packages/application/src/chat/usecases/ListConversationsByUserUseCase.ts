import { IConversationParticipantRepository } from '@forreal/domain/chat/ports/IConversationParticipantRepository';
import { IConversationRepository } from '@forreal/domain/chat/ports/IConversationRepository';

export class ListConversationsByUserUseCase {
  constructor(
    private readonly participantRepository: IConversationParticipantRepository,
    private readonly conversationRepository?: IConversationRepository,
  ) {}

  async execute(input: { userId: string; type?: 'PRIVATE' | 'GROUP' }) {
    const participants = await this.participantRepository.listByUser(input.userId);
    const ids = Array.from(new Set(participants.map(p => p.conversationId)));
    
    if (input.type && this.conversationRepository) {
      const conversations = await Promise.all(ids.map(id => this.conversationRepository!.findById(id)));
      const filteredIds = conversations
        .filter(conv => conv && conv.type === input.type)
        .map(conv => conv!.id);
      return filteredIds.map(id => ({ id }));
    }
    
    return ids.map(id => ({ id }));
  }
}
