export class Notification {
  constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _title: string,
    private readonly _content: string,
    private readonly _type: string,
    private readonly _createdAt: Date,
    private _readAt: Date | null = null,
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

  isRead(): boolean {
    return this._readAt !== null;
  }

  markAsRead(at = new Date()): void {
    if (!this._readAt) {
      this._readAt = at;
    }
  }
}
