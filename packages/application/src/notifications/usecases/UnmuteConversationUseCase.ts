import { IConversationNotificationSettingsRepository } from '@forreal/domain';

export class UnmuteConversationUseCase {
  constructor(
    private readonly settingsRepository: IConversationNotificationSettingsRepository,
  ) {}

  async execute(input: { userId: string; conversationId: string }) {
    const settings = await this.settingsRepository.upsert({
      userId: input.userId,
      conversationId: input.conversationId,
      muted: false,
      mutedUntil: null,
    });
    return { muted: settings.isMuted() };
  }
}
