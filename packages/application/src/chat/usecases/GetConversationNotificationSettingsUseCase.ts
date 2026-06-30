import { IConversationNotificationSettingsRepository } from '@forreal/domain';

export class GetConversationNotificationSettingsUseCase {
  constructor(
    private readonly settingsRepository: IConversationNotificationSettingsRepository,
  ) {}

  async execute(input: { userId: string; conversationId: string }) {
    const settings = await this.settingsRepository.findByUserAndConversation(
      input.userId,
      input.conversationId,
    );
    if (!settings) return { muted: false, mutedUntil: null };
    return {
      muted: settings.isMuted(),
      mutedUntil: settings.mutedUntil,
    };
  }
}
