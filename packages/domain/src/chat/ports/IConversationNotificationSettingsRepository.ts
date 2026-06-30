import { ConversationNotificationSettings } from '../ConversationNotificationSettings';

export const IConversationNotificationSettingsRepository = Symbol(
  'IConversationNotificationSettingsRepository',
);

export interface IConversationNotificationSettingsRepository {
  findByUserAndConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationNotificationSettings | null>;

  upsert(params: {
    userId: string;
    conversationId: string;
    muted: boolean;
    mutedUntil?: Date | null;
  }): Promise<ConversationNotificationSettings>;
}
