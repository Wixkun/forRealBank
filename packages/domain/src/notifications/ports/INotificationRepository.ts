import { Notification } from '../Notification';

export const INotificationRepository = Symbol('INotificationRepository');

export interface INotificationRepository {
  findById(id: string): Promise<Notification | null>;
  save(notification: Notification): Promise<void>;
  create(userId: string, title: string, content: string, type: string): Promise<Notification>;
  listByUser(userId: string, params?: { limit?: number; offset?: number }): Promise<Notification[]>;
  deleteById(id: string): Promise<void>;
}
