import { IConversationParticipantRepository } from '@forreal/domain';
import { IConversationRepository } from '@forreal/domain';
import { IUserRepository } from '@forreal/domain';
import { IMessageRepository } from '@forreal/domain';
import { IConversationNotificationSettingsRepository } from '@forreal/domain';
import { IConversationUserStateRepository } from '@forreal/domain';
import { RoleName } from '@forreal/domain';

export interface ConversationListItem {
  id: string;
  name: string;
  type: 'PRIVATE' | 'GROUP';
  createdAt?: Date;
  participants: Array<{ id: string; firstName: string; lastName: string; role: string }>;
  lastMessage: string | null;
  lastMessageDate: string | null;
  unreadCount: number;
  hasUnread: boolean;
  isMuted: boolean;
}

/**
 * Liste enrichie des conversations d'un utilisateur : nom, participants,
 * dernier message, non-lus et statut « muet », calculés sans requête N+1
 * (résumé agrégé + lookups groupés des utilisateurs et des réglages).
 * Les conversations masquées PAR l'utilisateur sont exclues (elles
 * réapparaissent automatiquement au prochain message reçu).
 */
export class ListConversationsByUserUseCase {
  constructor(
    private readonly participantRepository: IConversationParticipantRepository,
    private readonly conversationRepository?: IConversationRepository,
    private readonly userRepository?: IUserRepository,
    private readonly messageRepository?: IMessageRepository,
    private readonly settingsRepository?: IConversationNotificationSettingsRepository,
    private readonly userStateRepository?: IConversationUserStateRepository,
  ) {}

  async execute(input: {
    userId: string;
    type?: 'PRIVATE' | 'GROUP';
  }): Promise<Array<{ id: string }> | ConversationListItem[]> {
    const participants = await this.participantRepository.listByUser(input.userId);
    const hiddenIds = new Set(
      this.userStateRepository
        ? await this.userStateRepository.listHiddenConversationIds(input.userId)
        : [],
    );
    const conversationIds = Array.from(new Set(participants.map((p) => p.conversationId))).filter(
      (id) => !hiddenIds.has(id),
    );

    if (!this.conversationRepository || !this.userRepository) {
      return conversationIds.map((id) => ({ id }));
    }

    // Conversations (filtrées par type éventuel).
    const conversations = (
      await Promise.all(conversationIds.map((id) => this.conversationRepository!.findById(id)))
    ).filter(
      (c): c is NonNullable<typeof c> => c !== null && (!input.type || c.type === input.type),
    );

    const keptIds = conversations.map((c) => c.id);

    // Participants de chaque conversation, puis lookup groupé des utilisateurs.
    const participantsByConversation = new Map<string, string[]>();
    const allUserIds = new Set<string>();
    await Promise.all(
      keptIds.map(async (id) => {
        const convParticipants = await this.participantRepository.listByConversation(id);
        const ids = convParticipants.map((p) => p.userId);
        participantsByConversation.set(id, ids);
        ids.forEach((uid) => allUserIds.add(uid));
      }),
    );

    const users = await this.userRepository.findByIds(Array.from(allUserIds));
    const userById = new Map(users.map((u) => [u.id, u]));

    // Résumés (non-lus + dernier message) et réglages « muet » en lots.
    const summaries = this.messageRepository
      ? await this.messageRepository.summarizeForUser(input.userId, keptIds)
      : {};
    const mutedIds = new Set(
      this.settingsRepository
        ? await this.settingsRepository.listMutedConversationIds(input.userId)
        : [],
    );

    return conversations.map((conversation) => {
      const memberIds = participantsByConversation.get(conversation.id) ?? [];
      const participantDetails = memberIds.map((uid) => {
        const user = userById.get(uid);
        const roles = user?.roles ? Array.from(user.roles) : [];
        const role = roles.includes(RoleName.DIRECTOR) ? RoleName.DIRECTOR : (roles[0] ?? '');
        return {
          id: uid,
          firstName: user?.firstName || 'Unknown',
          lastName: user?.lastName || 'User',
          role,
        };
      });

      let name: string;
      if (conversation.type === 'PRIVATE') {
        const other = participantDetails.find((p) => p.id !== input.userId);
        name = other ? `${other.firstName} ${other.lastName}` : 'Private Conversation';
      } else {
        // Nom personnalisé du groupe s'il existe, sinon libellé dérivé.
        name = conversation.name || `Group (${participantDetails.length} members)`;
      }

      const summary = summaries[conversation.id] ?? {
        unreadCount: 0,
        lastMessageContent: null,
        lastMessageAt: null,
      };

      return {
        id: conversation.id,
        name,
        type: conversation.type,
        createdAt: conversation.createdAt,
        participants: participantDetails,
        lastMessage: summary.lastMessageContent,
        lastMessageDate: summary.lastMessageAt ? summary.lastMessageAt.toISOString() : null,
        unreadCount: summary.unreadCount,
        hasUnread: summary.unreadCount > 0,
        isMuted: mutedIds.has(conversation.id),
      };
    });
  }
}
