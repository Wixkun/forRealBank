import { RoleName } from './RoleName';

export class User {
  constructor(
    private readonly _id: string,
    private _email: string,
    private _passwordHash: string,
    private _roles: Set<RoleName> = new Set<RoleName>(),
    private _createdAt: Date,
    private _updatedAt: Date,
    private _firstName: string,
    private _lastName: string,
    private _lastLoginAt?: Date,
    private _isBanned: boolean = false,
    private _bannedAt?: Date,
    private _banReason?: string,

    // sécurité auth (anti brute-force)
    private _failedLoginCount: number = 0,
    private _lockUntil?: Date,
  ) {}

  get id() {
    return this._id;
  }
  get email() {
    return this._email;
  }
  get passwordHash() {
    return this._passwordHash;
  }
  get roles(): Set<RoleName> {
    return new Set<RoleName>(this._roles ?? new Set<RoleName>());
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }
  get firstName() {
    return this._firstName;
  }
  get lastName() {
    return this._lastName;
  }
  get lastLoginAt() {
    return this._lastLoginAt;
  }
  get isBanned() {
    return this._isBanned;
  }
  get bannedAt() {
    return this._bannedAt;
  }
  get banReason() {
    return this._banReason;
  }

  get failedLoginCount() {
    return this._failedLoginCount ?? 0;
  }
  get lockUntil() {
    return this._lockUntil;
  }

  isLocked(at = new Date()): boolean {
    return !!this._lockUntil && this._lockUntil.getTime() > at.getTime();
  }

  recordFailedLogin(maxAttempts: number, lockMs: number, at = new Date()) {
    const current = this._failedLoginCount ?? 0;
    const next = current + 1;
    this._failedLoginCount = next;
    if (next >= maxAttempts) {
      this._lockUntil = new Date(at.getTime() + lockMs);
    }
    this.touch(at);
  }

  resetLoginFailures(at = new Date()) {
    this._failedLoginCount = 0;
    this._lockUntil = undefined;
    this.touch(at);
  }

  setNames(first: string, last: string) {
    this._firstName = first;
    this._lastName = last;
    this.touch();
  }

  markLogin(at = new Date()) {
    this._lastLoginAt = at;
    // reset anti brute-force state on successful login
    this._failedLoginCount = 0;
    this._lockUntil = undefined;
    this.touch(at);
  }
  ban(reason?: string, at = new Date()) {
    this._isBanned = true;
    this._bannedAt = at;
    this._banReason = reason;
    this.touch(at);
  }
  unban() {
    this._isBanned = false;
    this._bannedAt = undefined;
    this._banReason = undefined;
    this.touch();
  }
  touch(at = new Date()) {
    this._updatedAt = at;
  }
}
