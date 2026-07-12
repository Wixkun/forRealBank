import {
  ConversationType,
  IConversationParticipantRepository,
  IConversationRepository,
  IConversationUserStateRepository,
  IUserRepository,
  RoleName,
} from '@forreal/domain';
import { ListContactableUsersUseCase } from './ListContactableUsersUseCase';

export interface OpenPrivateConversationResult {
  conversationId: string;
  created: boolean;
}

export class OpenPrivateConversationUseCase {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly participantRepository: IConversationParticipantRepository,
    private readonly userRepository: IUserRepository,
    private readonly userStateRepository: IConversationUserStateRepository,
    private readonly contactableUsers: ListContactableUsersUseCase,
  ) {}

  async execute(input: {
    requesterId: string;
    requesterRoles: RoleName[];
    targetUserId: string;
  }): Promise<OpenPrivateConversationResult> {
    const { requesterId, requesterRoles, targetUserId } = input;
    if (!targetUserId || targetUserId === requesterId) {
      throw new Error('INVALID_TARGET');
    }

    const target = await this.userRepository.findById(targetUserId);
    if (!target || target.isBanned) {
      throw new Error('INVALID_TARGET');
    }

    const allowed = await this.contactableUsers.isContactAllowed(
      requesterId,
      requesterRoles,
      targetUserId,
    );
    if (!allowed) {
      throw new Error('CONTACT_NOT_ALLOWED');
    }

    const existing = await this.conversationRepository.findPrivateBetween(
      requesterId,
      targetUserId,
    );
    if (existing) {
      // Réouverture : ne démasque que pour le demandeur (visibilité individuelle).
      await this.userStateRepository.setHidden(requesterId, existing.id, false);
      return { conversationId: existing.id, created: false };
    }

    const created = await this.conversationRepository.create(ConversationType.PRIVATE);
    await this.participantRepository.addParticipantIfNotExists(created.id, requesterId);
    await this.participantRepository.addParticipantIfNotExists(created.id, targetUserId);

    // Anti-doublon en cas de double clic / requêtes concurrentes : tout le
    // monde converge vers la conversation la plus ancienne (tri createdAt).
    const canonical = await this.conversationRepository.findPrivateBetween(
      requesterId,
      targetUserId,
    );
    if (canonical && canonical.id !== created.id) {
      await this.conversationRepository.deleteById(created.id);
      await this.userStateRepository.setHidden(requesterId, canonical.id, false);
      return { conversationId: canonical.id, created: false };
    }

    return { conversationId: created.id, created: true };
  }
}
