import { ConversationNotificationSettings } from '@forreal/domain';
import { ConversationNotificationSettingsEntity } from '../entities/ConversationNotificationSettingsEntity';

export class ConversationNotificationSettingsMapper {
  static toDomain(entity: ConversationNotificationSettingsEntity): ConversationNotificationSettings {
    return new ConversationNotificationSettings(
      entity.id,
      entity.userId,
      entity.conversationId,
      entity.muted,
      entity.mutedUntil,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
