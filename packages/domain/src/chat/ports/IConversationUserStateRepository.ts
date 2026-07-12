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

  /**
   * Masque / démasque la conversation pour CET utilisateur uniquement
   * (jamais pour les autres participants). Crée la ligne d'état si absente.
   */
  setHidden(userId: string, conversationId: string, hidden: boolean): Promise<void>;

  /** Conversations masquées par l'utilisateur (à exclure de sa liste). */
  listHiddenConversationIds(userId: string): Promise<string[]>;

  /**
   * Démasque la conversation pour TOUS ses participants (nouveau message →
   * elle réapparaît dans chaque liste ; non-lus et mute inchangés).
   */
  clearHiddenForConversation(conversationId: string): Promise<void>;
}
