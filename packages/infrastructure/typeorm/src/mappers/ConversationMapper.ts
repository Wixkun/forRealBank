import { Conversation, ConversationType } from '@forreal/domain/chat/Conversation';
import { ConversationEntity } from '../entities/ConversationEntity';

export class ConversationMapper {
  static toPersistence(conversation: Conversation): ConversationEntity {
    const entity = new ConversationEntity();
    entity.id = conversation.id;
    entity.type = conversation.type as ConversationType;
    return entity;
  }

  static toDomain(entity: ConversationEntity): Conversation {
    return new Conversation(
      entity.id,
      entity.type as ConversationType,
      entity.createdAt,
    );
  }
}
