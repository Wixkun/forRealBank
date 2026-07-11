import {
  IConversationRepository,
  IConversationParticipantRepository,
  IUserRepository,
  IAdvisorClientRepository,
  ConversationType,
  RoleName,
} from '@forreal/domain';

export interface CreateGroupInput {
  creatorId: string;
  creatorRoles: RoleName[];
  name: string;
  participantIds: string[];
}

export interface CreateGroupResult {
  conversationId: string;
  name: string;
  participantIds: string[];
}

const MAX_GROUP_NAME_LENGTH = 120;
const MIN_OTHER_PARTICIPANTS = 2;
const MAX_GROUP_MEMBERS = 50;

/**
 * Crée une conversation de groupe nommée. La validation métier vit ici ;
 * l'autorisation par rôle (ADVISOR/DIRECTOR/ADMIN) est faite en amont par le
 * guard du contrôleur. Le créateur est toujours ajouté comme participant.
 *
 * Règle d'ajout : un DIRECTOR ou ADMIN peut ajouter n'importe quel utilisateur ;
 * un ADVISOR ne peut ajouter que ses propres clients (relation advisor_clients).
 */
export class CreateGroupConversationUseCase {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly participantRepository: IConversationParticipantRepository,
    private readonly userRepository: IUserRepository,
    private readonly advisorClientRepository: IAdvisorClientRepository,
  ) {}

  async execute(input: CreateGroupInput): Promise<CreateGroupResult> {
    const name = (input.name ?? '').trim();
    if (!name || name.length > MAX_GROUP_NAME_LENGTH) {
      throw new Error('INVALID_GROUP_NAME');
    }

    // Participants dédupliqués, sans le créateur (ajouté d'office).
    const requested = Array.from(
      new Set((input.participantIds ?? []).filter((id) => id && id !== input.creatorId)),
    );
    if (requested.length < MIN_OTHER_PARTICIPANTS) {
      throw new Error('NOT_ENOUGH_PARTICIPANTS');
    }
    if (requested.length + 1 > MAX_GROUP_MEMBERS) {
      throw new Error('TOO_MANY_PARTICIPANTS');
    }

    // Les participants doivent exister et ne pas être bannis (identités jamais
    // supposées valides sur la seule foi du frontend).
    const users = await this.userRepository.findByIds(requested);
    if (users.length !== requested.length || users.some((u) => u.isBanned)) {
      throw new Error('INVALID_PARTICIPANT');
    }

    // Restriction de périmètre : un ADVISOR ne peut ajouter que ses clients.
    // Un DIRECTOR / ADMIN n'est pas restreint.
    const roles = input.creatorRoles ?? [];
    const isPrivileged = roles.includes(RoleName.DIRECTOR) || roles.includes(RoleName.ADMIN);
    if (!isPrivileged) {
      const links = await this.advisorClientRepository.listClientsOf(input.creatorId);
      const allowedClientIds = new Set(links.map((l) => l.clientId));
      const outsider = requested.find((id) => !allowedClientIds.has(id));
      if (outsider) {
        throw new Error('PARTICIPANT_NOT_ALLOWED');
      }
    }

    const conversation = await this.conversationRepository.create(ConversationType.GROUP, name);
    const memberIds = [input.creatorId, ...requested];
    for (const userId of memberIds) {
      await this.participantRepository.addParticipantIfNotExists(conversation.id, userId);
    }

    return { conversationId: conversation.id, name, participantIds: memberIds };
  }
}
