import { INotificationRepository } from '@forreal/domain';

export class MarkAllNotificationsReadUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: { userId: string }) {
    const updatedCount = await this.notificationRepository.markAllAsRead(input.userId);
    return { success: true, updatedCount };
  }
}
