export enum NewsStatus {
  SECURITY = 'SECURITY',
  TRANSACTIONS = 'TRANSACTIONS',
  PAYMENTS = 'PAYMENTS',
  ACCOUNT_UPDATES = 'ACCOUNT_UPDATES',
  SYSTEM = 'SYSTEM',
  INFORMATION = 'INFORMATION',
}

export class News {
  constructor(
    private readonly _id: string,
    private readonly _authorId: string | null,
    private _title: string,
    private _content: string,
    private readonly _createdAt: Date,
    private _status: NewsStatus = NewsStatus.INFORMATION,
    private readonly _userId: string | null = null,
    private _archivedAt: Date | null = null,
  ) {}

  get id() { return this._id; }
  get authorId() { return this._authorId; }
  get title() { return this._title; }
  get content() { return this._content; }
  get createdAt() { return this._createdAt; }
  get status() { return this._status; }
  get userId() { return this._userId; }
  get archivedAt() { return this._archivedAt; }
  get isArchived() { return this._archivedAt !== null; }

  updateTitle(title: string) { this._title = title; }
  updateContent(content: string) { this._content = content; }
  archive() { this._archivedAt = new Date(); }

  hasAuthor(): boolean { return this._authorId !== null; }
}
