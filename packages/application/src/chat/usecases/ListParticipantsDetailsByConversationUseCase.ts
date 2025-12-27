import { IConversationParticipantRepository } from '@forreal/domain/chat/ports/IConversationParticipantRepository';
import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { RoleName } from '@forreal/domain/user/RoleName';

export class ListParticipantsDetailsByConversationUseCase {
  constructor(
    private readonly participantRepository: IConversationParticipantRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: { conversationId: string }) {
    const participants = await this.participantRepository.listByConversation(input.conversationId);
    const results = [] as Array<{ id: string; name: string; role: RoleName | string }>;
    for (const p of participants) {
      const user = await this.userRepository.findById(p.userId);
      const roles = (user as any)?.roles as Set<RoleName> | RoleName[] | undefined;
      let role: RoleName | string = RoleName.CLIENT;
      if (roles) {
        const arr = Array.isArray(roles) ? roles : Array.from(roles);
        if (arr.includes(RoleName.DIRECTOR)) role = RoleName.DIRECTOR;
        else if (arr.includes(RoleName.ADVISOR)) role = RoleName.ADVISOR;
        else role = RoleName.CLIENT;
      }
      const name = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur';
      results.push({ id: p.userId, name, role });
    }
    return results;
  }
}
