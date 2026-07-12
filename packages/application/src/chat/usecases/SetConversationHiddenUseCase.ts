import { IConversationUserStateRepository } from '@forreal/domain';

export class SetConversationHiddenUseCase {
  constructor(private readonly userStateRepository: IConversationUserStateRepository) {}

  async execute(input: { userId: string; conversationId: string; hidden: boolean }) {
    await this.userStateRepository.setHidden(input.userId, input.conversationId, input.hidden);
    return { success: true, hidden: input.hidden };
  }
}
