import { INotificationRepository } from '@forreal/domain';

type BulkMarkAllReadRepo = {
  markAllReadByUser(userId: string): Promise<number>;
};

export class MarkAllNotificationsReadUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: { userId: string }) {
    const repoAny = this.notificationRepository as unknown as Partial<BulkMarkAllReadRepo>;

    if (typeof repoAny.markAllReadByUser === 'function') {
      const updatedCount = await repoAny.markAllReadByUser(input.userId);
      return { success: true, updatedCount };
    }

    const notifications = await this.notificationRepository.listByUser(input.userId, {
      limit: 1000,
      offset: 0,
    });

    let updatedCount = 0;

    for (const n of notifications) {
      if (!n.isRead()) {
        n.markAsRead();
        await this.notificationRepository.save(n);
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  }
}
