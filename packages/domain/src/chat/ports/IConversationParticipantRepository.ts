import { ConversationParticipant } from '../ConversationParticipant';

export const IConversationParticipantRepository = Symbol('IConversationParticipantRepository');

export interface IConversationParticipantRepository {
  findById(id: string): Promise<ConversationParticipant | null>;
  save(participant: ConversationParticipant): Promise<void>;
  addParticipant(conversationId: string, userId: string): Promise<ConversationParticipant>;
  addParticipantIfNotExists(
    conversationId: string,
    userId: string,
  ): Promise<{ participant: ConversationParticipant; inserted: boolean }>;
  removeParticipant(conversationId: string, userId: string): Promise<void>;
  listByConversation(conversationId: string): Promise<ConversationParticipant[]>;
  listByUser(userId: string): Promise<ConversationParticipant[]>;
}
