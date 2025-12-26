import { INotificationRepository } from '@forreal/domain/notifications/ports/INotificationRepository';

export class MarkNotificationReadUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: { notificationId: string }) {
    const notification = await this.notificationRepository.findById(input.notificationId);
    if (!notification) throw new Error('NOTIFICATION_NOT_FOUND');
    notification.markAsRead();
    await this.notificationRepository.save(notification);
    return { success: true };
  }
}
