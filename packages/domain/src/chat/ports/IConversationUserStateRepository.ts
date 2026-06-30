import { ConversationUserState } from '../ConversationUserState';

export const IConversationUserStateRepository = Symbol('IConversationUserStateRepository');

export interface IConversationUserStateRepository {
  findByUserAndConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationUserState | null>;

  upsert(params: {
    userId: string;
    conversationId: string;
    lastReadMessageId: string;
  }): Promise<ConversationUserState>;
}
