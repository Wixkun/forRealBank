import { Notification } from '@forreal/domain/notifications/Notification';
import { NotificationEntity } from '../entities/NotificationEntity';

export class NotificationMapper {
  static toPersistence(notification: Notification): NotificationEntity {
    const entity = new NotificationEntity();
    entity.id = notification.id;
    entity.title = notification.title;
    entity.content = notification.content;
    entity.type = notification.type;
    return entity;
  }

  static toDomain(entity: NotificationEntity): Notification {
    return new Notification(
      entity.id,
      entity.user.id,
      entity.title,
      entity.content,
      entity.type,
      entity.createdAt,
      entity.readAt,
    );
  }
}
