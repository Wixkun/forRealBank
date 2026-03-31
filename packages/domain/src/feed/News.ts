export class News {
  constructor(
    private readonly _id: string,
    private readonly _authorId: string | null,
    private _title: string,
    private _content: string,
    private readonly _createdAt: Date,
  ) {}

  get id() {
    return this._id;
  }

  get authorId() {
    return this._authorId;
  }

  get title() {
    return this._title;
  }

  get content() {
    return this._content;
  }

  updateTitle(title: string) {
    this._title = title;
  }

  updateContent(content: string) {
    this._content = content;
  }

  get createdAt() {
    return this._createdAt;
  }

  hasAuthor(): boolean {
    return this._authorId !== null;
  }
}
