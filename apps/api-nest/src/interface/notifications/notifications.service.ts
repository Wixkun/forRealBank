import { Injectable, Inject } from '@nestjs/common';
import { SendNotificationUseCase } from '@forreal/application/notifications/usecases/SendNotificationUseCase';
import { MarkNotificationReadUseCase } from '@forreal/application/notifications/usecases/MarkNotificationReadUseCase';
import { ListNotificationsByUserUseCase } from '@forreal/application/notifications/usecases/ListNotificationsByUserUseCase';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(SendNotificationUseCase) private readonly sendNotifUC: SendNotificationUseCase,
    @Inject(MarkNotificationReadUseCase) private readonly markReadUC: MarkNotificationReadUseCase,
    @Inject(ListNotificationsByUserUseCase) private readonly listByUserUC: ListNotificationsByUserUseCase,
  ) {}

  async send(userId: string, title: string, content: string, type: string) {
    return this.sendNotifUC.execute({ userId, title, content, type });
  }

  async markRead(notificationId: string) {
    return this.markReadUC.execute({ notificationId });
  }

  async listByUser(userId: string, limit = 50, offset = 0) {
    return this.listByUserUC.execute({ userId, limit, offset });
  }
}
