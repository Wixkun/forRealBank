import { IConversationNotificationSettingsRepository } from '@forreal/domain';

export class MuteConversationUseCase {
  constructor(
    private readonly settingsRepository: IConversationNotificationSettingsRepository,
  ) {}

  async execute(input: {
    userId: string;
    conversationId: string;
    mutedUntil?: Date | null;
  }) {
    const settings = await this.settingsRepository.upsert({
      userId: input.userId,
      conversationId: input.conversationId,
      muted: true,
      mutedUntil: input.mutedUntil ?? null,
    });
    return {
      muted: settings.isMuted(),
      mutedUntil: settings.mutedUntil,
    };
  }
}
