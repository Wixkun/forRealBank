import { INotificationRepository } from '@forreal/domain/notifications/ports/INotificationRepository';

export class ListNotificationsByUserUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: { userId: string; limit?: number; offset?: number }) {
    const notifications = await this.notificationRepository.listByUser(input.userId, {
      limit: input.limit,
      offset: input.offset,
    });
    return notifications.map(n => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      content: n.content,
      type: n.type,
      createdAt: n.createdAt,
      readAt: n.readAt,
    }));
  }
}
