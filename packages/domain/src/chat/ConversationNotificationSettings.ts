export class ConversationNotificationSettings {
  constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _conversationId: string,
    private _muted: boolean,
    private _mutedUntil: Date | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  get id() { return this._id; }
  get userId() { return this._userId; }
  get conversationId() { return this._conversationId; }
  get muted() { return this._muted; }
  get mutedUntil() { return this._mutedUntil; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }

  // muted=true, mutedUntil=null → muted indefinitely
  // muted=true, mutedUntil > now → muted temporarily
  // muted=true, mutedUntil <= now → expired, treat as unmuted
  isMuted(): boolean {
    if (!this._muted) return false;
    if (!this._mutedUntil) return true;
    return this._mutedUntil > new Date();
  }

  mute(until?: Date | null): void {
    this._muted = true;
    this._mutedUntil = until ?? null;
    this._updatedAt = new Date();
  }

  unmute(): void {
    this._muted = false;
    this._mutedUntil = null;
    this._updatedAt = new Date();
  }
}
