import {
  IConversationUserStateRepository,
  INotificationRepository,
  NotificationType,
} from '@forreal/domain';

export class UpdateConversationUserStateUseCase {
  constructor(
    private readonly conversationUserStateRepository: IConversationUserStateRepository,
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(input: { userId: string; conversationId: string; lastReadMessageId: string }) {
    await this.conversationUserStateRepository.upsert({
      userId: input.userId,
      conversationId: input.conversationId,
      lastReadMessageId: input.lastReadMessageId,
    });

    const groupKey = `conversation:${input.conversationId}`;
    const existing = await this.notificationRepository.findUnreadByGroupKey(
      input.userId,
      NotificationType.MESSAGE,
      groupKey,
    );
    if (existing) {
      await this.notificationRepository.markAsRead(existing.id, input.userId);
    }

    return { success: true };
  }
}
