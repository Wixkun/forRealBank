import { Notification, NotificationType, NotificationTargetType } from '@forreal/domain';
import { NotificationEntity } from '../entities/NotificationEntity';

export class NotificationMapper {
  static toDomain(entity: NotificationEntity): Notification {
    return new Notification(
      entity.id,
      entity.user.id,
      entity.title,
      entity.content,
      entity.type as NotificationType,
      entity.createdAt,
      entity.readAt,
      entity.updatedAt,
      entity.targetType as NotificationTargetType | null,
      entity.targetId,
      entity.targetUrl,
      entity.groupKey,
      entity.oldestUnreadMessageId,
      entity.unreadCount ?? 1,
    );
  }
}
