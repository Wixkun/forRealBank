export class AdvisorClient {
  constructor(
    private readonly _id: string,
    private readonly _advisorId: string,
    private readonly _clientId: string,
    private readonly _createdAt: Date,
  ) {}

  get id() {
    return this._id;
  }

  get advisorId() {
    return this._advisorId;
  }

  get clientId() {
    return this._clientId;
  }

  get createdAt() {
    return this._createdAt;
  }
}
