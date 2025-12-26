import { IConversationParticipantRepository } from '@forreal/domain/chat/ports/IConversationParticipantRepository';

export class AddConversationParticipantUseCase {
  constructor(private readonly participantRepository: IConversationParticipantRepository) {}

  async execute(input: { conversationId: string; userId: string }) {
    const participant = await this.participantRepository.addParticipant(input.conversationId, input.userId);
    return { participantId: participant.id, joinedAt: participant.joinedAt };
  }
}
