import { INotificationRepository, NotificationType, NotificationTargetType } from '@forreal/domain';

export class SendNotificationUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: {
    userId: string;
    title: string;
    content: string;
    type: NotificationType;
    targetType?: NotificationTargetType | null;
    targetId?: string | null;
    targetUrl?: string | null;
    groupKey?: string | null;
  }) {
    const notification = await this.notificationRepository.create({
      userId: input.userId,
      title: input.title,
      content: input.content,
      type: input.type,
      targetType: input.targetType,
      targetId: input.targetId,
      targetUrl: input.targetUrl,
      groupKey: input.groupKey,
    });
    return {
      notificationId: notification.id,
      userId: notification.userId,
      title: notification.title,
      content: notification.content,
      type: notification.type,
      createdAt: notification.createdAt,
    };
  }
}
