export class EmailVerificationToken {
  constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _tokenHash: string,
    private readonly _expiresAt: Date,
    private readonly _createdAt: Date = new Date(),
    private _usedAt?: Date,
  ) {}

  get id() {
    return this._id;
  }

  get userId() {
    return this._userId;
  }

  get tokenHash() {
    return this._tokenHash;
  }

  get expiresAt() {
    return this._expiresAt;
  }

  get createdAt() {
    return this._createdAt;
  }

  get usedAt() {
    return this._usedAt;
  }

  isUsable(at = new Date()): boolean {
    return !this._usedAt && this._expiresAt.getTime() > at.getTime();
  }

  markUsed(at = new Date()) {
    this._usedAt = at;
  }
}
