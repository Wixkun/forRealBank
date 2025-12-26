import { Message } from '@forreal/domain/chat/Message';
import { MessageEntity } from '../entities/MessageEntity';

export class MessageMapper {
  static toPersistence(message: Message): MessageEntity {
    const entity = new MessageEntity();
    entity.id = message.id;
    entity.content = message.content;
    return entity;
  }

  static toDomain(entity: MessageEntity): Message {
    return new Message(
      entity.id,
      entity.conversation.id,
      entity.sender.id,
      entity.content,
      entity.createdAt,
      entity.readAt,
    );
  }
}
