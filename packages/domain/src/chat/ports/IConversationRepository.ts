import { Conversation, ConversationType } from '../Conversation';

export const IConversationRepository = Symbol('IConversationRepository');

export interface IConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  save(conversation: Conversation): Promise<void>;
  create(type: ConversationType): Promise<Conversation>;
  deleteById(id: string): Promise<void>;
}
