import { INotificationRepository } from '@forreal/domain/notifications/ports/INotificationRepository';

export class SendNotificationUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: { userId: string; title: string; content: string; type: string }) {
    const notification = await this.notificationRepository.create(input.userId, input.title, input.content, input.type);
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
