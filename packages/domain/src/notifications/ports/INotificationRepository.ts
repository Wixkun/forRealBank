import { Notification } from '../Notification';
import { NotificationType } from '../NotificationType';
import { NotificationTargetType } from '../NotificationTargetType';

export const INotificationRepository = Symbol('INotificationRepository');

export interface CreateNotificationParams {
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  targetType?: NotificationTargetType | null;
  targetId?: string | null;
  targetUrl?: string | null;
  groupKey?: string | null;
  oldestUnreadMessageId?: string | null;
  unreadCount?: number;
}

export interface INotificationRepository {
  findById(id: string): Promise<Notification | null>;
  save(notification: Notification): Promise<void>;
  create(params: CreateNotificationParams): Promise<Notification>;
  listByUser(userId: string, params?: { limit?: number; offset?: number }): Promise<Notification[]>;
  deleteById(id: string, userId: string): Promise<void>;
  countUnread(userId: string): Promise<number>;
  markAsRead(id: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<number>;
  findUnreadByGroupKey(userId: string, type: NotificationType, groupKey: string): Promise<Notification | null>;
  incrementGrouped(id: string, title: string, content: string): Promise<void>;
}
