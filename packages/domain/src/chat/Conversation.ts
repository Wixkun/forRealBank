export enum ConversationType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
}

export class Conversation {
  constructor(
    private readonly _id: string,
    private readonly _type: ConversationType,
    private readonly _createdAt: Date,
  ) {}

  get id() {
    return this._id;
  }

  get type() {
    return this._type;
  }

  get createdAt() {
    return this._createdAt;
  }

  isPrivate(): boolean {
    return this._type === ConversationType.PRIVATE;
  }

  isGroup(): boolean {
    return this._type === ConversationType.GROUP;
  }
}
