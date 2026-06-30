import { Injectable, Inject } from '@nestjs/common';
import { NotificationType, NotificationTargetType } from '@forreal/domain';
import { SendNotificationUseCase } from '@forreal/application';
import { ListNotificationsByUserUseCase } from '@forreal/application';
import { GetUnreadCountUseCase } from '@forreal/application';
import { MarkNotificationReadUseCase } from '@forreal/application';
import { MarkAllNotificationsReadUseCase } from '@forreal/application';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(SendNotificationUseCase) private readonly sendUC: SendNotificationUseCase,
    @Inject(ListNotificationsByUserUseCase)
    private readonly listUC: ListNotificationsByUserUseCase,
    @Inject(GetUnreadCountUseCase) private readonly unreadCountUC: GetUnreadCountUseCase,
    @Inject(MarkNotificationReadUseCase) private readonly markReadUC: MarkNotificationReadUseCase,
    @Inject(MarkAllNotificationsReadUseCase)
    private readonly markAllReadUC: MarkAllNotificationsReadUseCase,
  ) {}

  async send(params: {
    userId: string;
    title: string;
    content: string;
    type: NotificationType;
    targetType?: NotificationTargetType | null;
    targetId?: string | null;
    targetUrl?: string | null;
    groupKey?: string | null;
  }) {
    return this.sendUC.execute(params);
  }

  async listByUser(userId: string, limit = 50, offset = 0) {
    return this.listUC.execute({ userId, limit, offset });
  }

  async countUnread(userId: string) {
    return this.unreadCountUC.execute({ userId });
  }

  async markRead(notificationId: string, userId: string) {
    return this.markReadUC.execute({ notificationId, userId });
  }

  async markAllRead(userId: string) {
    return this.markAllReadUC.execute({ userId });
  }
}
