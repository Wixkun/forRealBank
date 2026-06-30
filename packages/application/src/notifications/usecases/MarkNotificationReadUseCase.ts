import { INotificationRepository } from '@forreal/domain';

export class MarkNotificationReadUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: { notificationId: string; userId: string }) {
    await this.notificationRepository.markAsRead(input.notificationId, input.userId);
    return { success: true };
  }
}
