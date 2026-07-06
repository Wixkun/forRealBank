export enum NewsStatus {
  SECURITY = 'SECURITY',
  TRANSACTION = 'TRANSACTION',
  PAYMENT = 'PAYMENT',
  ACCOUNT = 'ACCOUNT',
  SYSTEM = 'SYSTEM',
  INFORMATION = 'INFORMATION',
}

export enum NewsSource {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
}

export const MANUAL_ALLOWED_TYPES: NewsStatus[] = [NewsStatus.INFORMATION, NewsStatus.SYSTEM];

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
    private readonly _source: NewsSource = NewsSource.MANUAL,
    private readonly _isActive: boolean = true,
    private readonly _imageUrl: string | null = null,
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
  get source() { return this._source; }
  get isActive() { return this._isActive; }
  get imageUrl() { return this._imageUrl; }

  updateTitle(title: string) { this._title = title; }
  updateContent(content: string) { this._content = content; }

  hasAuthor(): boolean { return this._authorId !== null; }
}
