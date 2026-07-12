export enum ConversationType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
}

export class Conversation {
  constructor(
    private readonly _id: string,
    private readonly _type: ConversationType,
    private readonly _createdAt: Date,
    private readonly _name: string | null = null,
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

  /** Nom personnalisé (groupes). Null pour les conversations privées. */
  get name() {
    return this._name;
  }

  isPrivate(): boolean {
    return this._type === ConversationType.PRIVATE;
  }

  isGroup(): boolean {
    return this._type === ConversationType.GROUP;
  }
}
