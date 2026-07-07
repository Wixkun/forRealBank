import { IConversationNotificationSettingsRepository } from '@forreal/domain';

export class SetConversationMuteUseCase {
  constructor(private readonly settingsRepository: IConversationNotificationSettingsRepository) {}

  async execute(input: {
    userId: string;
    conversationId: string;
    muted: boolean;
    mutedUntil?: Date | null;
  }) {
    const settings = await this.settingsRepository.upsert({
      userId: input.userId,
      conversationId: input.conversationId,
      muted: input.muted,
      mutedUntil: input.muted ? (input.mutedUntil ?? null) : null,
    });
    return {
      muted: settings.isMuted(),
      mutedUntil: settings.mutedUntil,
    };
  }
}
