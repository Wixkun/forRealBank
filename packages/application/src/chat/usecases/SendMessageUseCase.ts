import {
  IMessageRepository,
  IConversationParticipantRepository,
  INotificationRepository,
  IConversationNotificationSettingsRepository,
  NotificationType,
  NotificationTargetType,
  ConversationParticipant,
} from '@forreal/domain';

export class SendMessageUseCase {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly conversationParticipantRepository: IConversationParticipantRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly conversationNotificationSettingsRepository: IConversationNotificationSettingsRepository,
  ) {}

  async execute(input: { conversationId: string; senderId: string; content: string }) {
    const message = await this.messageRepository.create(
      input.conversationId,
      input.senderId,
      input.content,
    );

    const participants = await this.conversationParticipantRepository.listByConversation(
      input.conversationId,
    );

    const recipients = participants.filter(
      (p: ConversationParticipant) => p.userId !== input.senderId,
    );

    for (const participant of recipients) {
      const settings =
        await this.conversationNotificationSettingsRepository.findByUserAndConversation(
          participant.userId,
          input.conversationId,
        );
      if (settings?.isMuted()) continue;

      const groupKey = `conversation:${input.conversationId}`;
      const existing = await this.notificationRepository.findUnreadByGroupKey(
        participant.userId,
        NotificationType.MESSAGE,
        groupKey,
      );

      if (existing) {
        const newCount = existing.unreadCount + 1;
        await this.notificationRepository.incrementGrouped(
          existing.id,
          `${newCount} nouveaux messages`,
          `Vous avez ${newCount} messages non lus`,
        );
      } else {
        await this.notificationRepository.create({
          userId: participant.userId,
          title: '1 nouveau message',
          content: 'Vous avez reçu un nouveau message',
          type: NotificationType.MESSAGE,
          targetType: NotificationTargetType.CONVERSATION,
          targetId: input.conversationId,
          targetUrl: `/dashboard/messages?conversationId=${input.conversationId}&messageId=${message.id}`,
          groupKey,
          oldestUnreadMessageId: message.id,
          unreadCount: 1,
        });
      }
    }

    return {
      messageId: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
    };
  }
}
