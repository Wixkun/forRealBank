import { Conversation, ConversationType } from '../Conversation';

export const IConversationRepository = Symbol('IConversationRepository');

export interface IConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  save(conversation: Conversation): Promise<void>;
  create(type: ConversationType, name?: string | null): Promise<Conversation>;
  deleteById(id: string): Promise<void>;

  /**
   * Conversation PRIVÉE existante entre deux utilisateurs (source de vérité
   * anti-doublon : basée sur les identifiants, jamais sur les noms affichés).
   */
  findPrivateBetween(userIdA: string, userIdB: string): Promise<Conversation | null>;
}
