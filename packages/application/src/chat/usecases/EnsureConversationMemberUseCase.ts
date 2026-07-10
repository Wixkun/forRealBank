import { IConversationParticipantRepository } from '@forreal/domain';

/**
 * Règle d'autorisation centralisée : un utilisateur ne peut agir sur une
 * conversation que s'il en est participant. Réutilisée côté REST (guard/policy)
 * et côté WebSocket (join_conversation, send_message…).
 */
export class EnsureConversationMemberUseCase {
  constructor(private readonly participants: IConversationParticipantRepository) {}

  async isMember(input: { conversationId: string; userId: string }): Promise<boolean> {
    if (!input.conversationId || !input.userId) return false;
    const members = await this.participants.listByConversation(input.conversationId);
    return members.some((p) => p.userId === input.userId);
  }
}
