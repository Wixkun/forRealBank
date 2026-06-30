import { INotificationRepository } from '@forreal/domain';

export class DeleteNotificationUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: { notificationId: string; userId: string }) {
    await this.notificationRepository.deleteById(input.notificationId, input.userId);
    return { success: true };
  }
}
