import { Message } from '../Message';

export const IMessageRepository = Symbol('IMessageRepository');

export interface IMessageRepository {
  findById(id: string): Promise<Message | null>;
  save(message: Message): Promise<void>;
  create(conversationId: string, senderId: string, content: string): Promise<Message>;
  listByConversation(conversationId: string, params?: { limit?: number; offset?: number }): Promise<Message[]>;
  deleteById(id: string): Promise<void>;
}
