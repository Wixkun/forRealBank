import { IConversationParticipantRepository } from '@forreal/domain';

export class AddConversationParticipantUseCase {
  constructor(private readonly participantRepository: IConversationParticipantRepository) {}

  async execute(input: { conversationId: string; userId: string }) {
    const { participant, inserted } = await this.participantRepository.addParticipantIfNotExists(
      input.conversationId,
      input.userId,
    );

    return { participantId: participant.id, joinedAt: participant.joinedAt, inserted };
  }
}
