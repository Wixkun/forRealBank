import { IConversationParticipantRepository } from '@forreal/domain';
import { IConversationRepository } from '@forreal/domain';
import { IUserRepository } from '@forreal/domain';
import { RoleName } from '@forreal/domain';

export class ListConversationsByUserUseCase {
  constructor(
    private readonly participantRepository: IConversationParticipantRepository,
    private readonly conversationRepository?: IConversationRepository,
    private readonly userRepository?: IUserRepository,
  ) {}

  async execute(input: { userId: string; type?: 'PRIVATE' | 'GROUP' }) {
    const participants = await this.participantRepository.listByUser(input.userId);
    const conversationIds = Array.from(new Set(participants.map((p) => p.conversationId)));

    if (!this.conversationRepository || !this.userRepository) {
      return conversationIds.map((id) => ({ id }));
    }

    const conversations = await Promise.all(
      conversationIds.map(async (id) => {
        const conversation = await this.conversationRepository!.findById(id);
        if (!conversation) return null;

        if (input.type && conversation.type !== input.type) return null;

        const convParticipants = await this.participantRepository.listByConversation(id);
        const participantDetails = await Promise.all(
          convParticipants.map(async (p) => {
            const user = await this.userRepository!.findById(p.userId);
            const roles = user?.roles ? Array.from(user.roles) : [];
            const role = roles.includes(RoleName.DIRECTOR) ? RoleName.DIRECTOR : roles[0] || '';

            return {
              id: p.userId,
              firstName: user?.firstName || 'Unknown',
              lastName: user?.lastName || 'User',
              role: role,
            };
          }),
        );

        let name = '';
        if (conversation.type === 'PRIVATE') {
          const otherParticipant = participantDetails.find((p) => p.id !== input.userId);
          name = otherParticipant
            ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
            : 'Private Conversation';
        } else {
          name = `Group (${participantDetails.length} members)`;
        }

        return {
          id: conversation.id,
          name,
          type: conversation.type,
          participants: participantDetails,
          createdAt: conversation.createdAt,
        };
      }),
    );

    return conversations.filter((c) => c !== null);
  }
}
