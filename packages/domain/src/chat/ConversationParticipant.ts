export class ConversationParticipant {
  constructor(
    private readonly _id: string,
    private readonly _conversationId: string,
    private readonly _userId: string,
    private readonly _joinedAt: Date,
  ) {}

  get id() {
    return this._id;
  }

  get conversationId() {
    return this._conversationId;
  }

  get userId() {
    return this._userId;
  }

  get joinedAt() {
    return this._joinedAt;
  }
}
