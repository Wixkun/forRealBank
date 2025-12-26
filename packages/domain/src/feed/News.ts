export class News {
  constructor(
    private readonly _id: string,
    private readonly _authorId: string | null,
    private readonly _title: string,
    private readonly _content: string,
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

  get createdAt() {
    return this._createdAt;
  }

  hasAuthor(): boolean {
    return this._authorId !== null;
  }
}
