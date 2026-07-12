import { Message } from '../Message';

export const IMessageRepository = Symbol('IMessageRepository');

export interface ConversationSummary {
  unreadCount: number;
  lastMessageContent: string | null;
  lastMessageAt: Date | null;
}

export interface IMessageRepository {
  findById(id: string): Promise<Message | null>;
  save(message: Message): Promise<void>;
  create(conversationId: string, senderId: string, content: string): Promise<Message>;
  listByConversation(
    conversationId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Message[]>;
  deleteById(id: string): Promise<void>;

  /**
   * Résumé par conversation pour un utilisateur, calculé en 2 requêtes (pas de
   * N+1) : nombre de messages non lus (émis par d'autres, postérieurs à la
   * dernière lecture de l'utilisateur) et dernier message.
   */
  summarizeForUser(
    userId: string,
    conversationIds: string[],
  ): Promise<Record<string, ConversationSummary>>;
}
