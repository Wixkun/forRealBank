import { ConversationUserState } from '@forreal/domain';
import { ConversationUserStateEntity } from '../entities/ConversationUserStateEntity';

export class ConversationUserStateMapper {
  static toDomain(entity: ConversationUserStateEntity): ConversationUserState {
    return new ConversationUserState(
      entity.id,
      entity.userId,
      entity.conversationId,
      entity.lastReadMessageId,
      entity.lastReadAt,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
