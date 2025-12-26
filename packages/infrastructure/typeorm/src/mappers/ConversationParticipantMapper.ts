import { ConversationParticipant } from '@forreal/domain/chat/ConversationParticipant';
import { ConversationParticipantEntity } from '../entities/ConversationParticipantEntity';

export class ConversationParticipantMapper {
  static toPersistence(participant: ConversationParticipant): ConversationParticipantEntity {
    const entity = new ConversationParticipantEntity();
    entity.id = participant.id;
    return entity;
  }

  static toDomain(entity: ConversationParticipantEntity): ConversationParticipant {
    return new ConversationParticipant(
      entity.id,
      entity.conversation.id,
      entity.user.id,
      entity.joinedAt,
    );
  }
}
