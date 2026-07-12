import {
  ConversationType,
  IAdvisorClientRepository,
  IConversationParticipantRepository,
  IConversationRepository,
  IUserRepository,
  RoleName,
} from '@forreal/domain';

/**
 * Une conversation privée entre un ADVISOR et un CLIENT n'est utilisable
 * (envoi de message, démasquage) que tant que la relation d'attribution
 * advisor_clients existe encore. Après une réattribution, l'ancienne
 * conversation est GELÉE : historique conservé et consultable, mais plus
 * aucun message ne peut y être envoyé — y compris via un appel direct à
 * l'API. Les groupes et les autres paires (director-client, etc.) ne sont
 * pas concernés.
 */
export class CanUseConversationUseCase {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly participantRepository: IConversationParticipantRepository,
    private readonly userRepository: IUserRepository,
    private readonly advisorClientRepository: IAdvisorClientRepository,
  ) {}

  /** true si la conversation accepte encore l'écriture / le démasquage. */
  async isWritable(conversationId: string): Promise<boolean> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || conversation.type !== ConversationType.PRIVATE) return true;

    const participants = await this.participantRepository.listByConversation(conversationId);
    if (participants.length !== 2) return true;

    const users = await this.userRepository.findByIds(participants.map((p) => p.userId));
    if (users.length !== 2) return true;

    // Paire advisor ↔ client (un DIRECTOR/ADMIN qui a aussi le rôle ADVISOR
    // n'est pas restreint : la règle vise la relation d'attribution).
    const advisor = users.find(
      (u) =>
        u.roles?.has(RoleName.ADVISOR) &&
        !u.roles?.has(RoleName.DIRECTOR) &&
        !u.roles?.has(RoleName.ADMIN),
    );
    const client = users.find(
      (u) => u.roles?.has(RoleName.CLIENT) && !u.roles?.has(RoleName.ADVISOR),
    );
    if (!advisor || !client) return true;

    const link = await this.advisorClientRepository.findAdvisorOf(client.id);
    return link?.advisorId === advisor.id;
  }
}
