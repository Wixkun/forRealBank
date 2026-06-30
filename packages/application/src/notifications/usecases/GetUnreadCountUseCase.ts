import { INotificationRepository } from '@forreal/domain';

export class GetUnreadCountUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: { userId: string }) {
    const count = await this.notificationRepository.countUnread(input.userId);
    return { count };
  }
}
