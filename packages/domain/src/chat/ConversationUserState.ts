export class ConversationUserState {
  constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _conversationId: string,
    private _lastReadMessageId: string | null,
    private _lastReadAt: Date | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  get id() {
    return this._id;
  }
  get userId() {
    return this._userId;
  }
  get conversationId() {
    return this._conversationId;
  }
  get lastReadMessageId() {
    return this._lastReadMessageId;
  }
  get lastReadAt() {
    return this._lastReadAt;
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }

  markRead(messageId: string): void {
    this._lastReadMessageId = messageId;
    this._lastReadAt = new Date();
    this._updatedAt = new Date();
  }
}
