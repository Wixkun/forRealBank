export class Message {
  constructor(
    private readonly _id: string,
    private readonly _conversationId: string,
    private readonly _senderId: string,
    private readonly _content: string,
    private readonly _createdAt: Date,
    private _readAt: Date | null = null,
  ) {}

  get id() {
    return this._id;
  }

  get conversationId() {
    return this._conversationId;
  }

  get senderId() {
    return this._senderId;
  }

  get content() {
    return this._content;
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
