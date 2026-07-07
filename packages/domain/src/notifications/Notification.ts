import { NotificationType } from './NotificationType';
import { NotificationTargetType } from './NotificationTargetType';

export class Notification {
  constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private _title: string,
    private _content: string,
    private readonly _type: NotificationType,
    private readonly _createdAt: Date,
    private _readAt: Date | null = null,
    private _updatedAt: Date = new Date(),
    private readonly _targetType: NotificationTargetType | null = null,
    private readonly _targetId: string | null = null,
    private readonly _targetUrl: string | null = null,
    private readonly _groupKey: string | null = null,
    private readonly _oldestUnreadMessageId: string | null = null,
    private _unreadCount: number = 1,
  ) {}

  get id() {
    return this._id;
  }
  get userId() {
    return this._userId;
  }
  get title() {
    return this._title;
  }
  get content() {
    return this._content;
  }
  get type() {
    return this._type;
  }
  get createdAt() {
    return this._createdAt;
  }
  get readAt() {
    return this._readAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }
  get targetType() {
    return this._targetType;
  }
  get targetId() {
    return this._targetId;
  }
  get targetUrl() {
    return this._targetUrl;
  }
  get groupKey() {
    return this._groupKey;
  }
  get oldestUnreadMessageId() {
    return this._oldestUnreadMessageId;
  }
  get unreadCount() {
    return this._unreadCount;
  }

  isRead(): boolean {
    return this._readAt !== null;
  }

  markAsRead(at = new Date()): void {
    if (!this._readAt) {
      this._readAt = at;
      this._updatedAt = at;
    }
  }

  updateGrouped(title: string, content: string): void {
    this._title = title;
    this._content = content;
    this._unreadCount += 1;
    this._updatedAt = new Date();
  }
}
