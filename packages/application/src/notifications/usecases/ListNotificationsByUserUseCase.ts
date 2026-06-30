import { INotificationRepository } from '@forreal/domain';

export class ListNotificationsByUserUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: { userId: string; limit?: number; offset?: number }) {
    const notifications = await this.notificationRepository.listByUser(input.userId, {
      limit: input.limit,
      offset: input.offset,
    });
    return notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      content: n.content,
      type: n.type,
      targetType: n.targetType,
      targetId: n.targetId,
      targetUrl: n.targetUrl,
      groupKey: n.groupKey,
      oldestUnreadMessageId: n.oldestUnreadMessageId,
      unreadCount: n.unreadCount,
      isRead: n.isRead(),
      readAt: n.readAt,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));
  }
}
