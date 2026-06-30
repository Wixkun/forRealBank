import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationUserState, IConversationUserStateRepository } from '@forreal/domain';
import { ConversationUserStateEntity } from '../entities/ConversationUserStateEntity';
import { v4 as uuidv4 } from 'uuid';

function toDomain(entity: ConversationUserStateEntity): ConversationUserState {
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

@Injectable()
export class ConversationUserStateRepository implements IConversationUserStateRepository {
  constructor(
    @InjectRepository(ConversationUserStateEntity)
    private readonly repo: Repository<ConversationUserStateEntity>,
  ) {}

  async findByUserAndConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationUserState | null> {
    const entity = await this.repo.findOne({ where: { userId, conversationId } });
    return entity ? toDomain(entity) : null;
  }

  async upsert(params: {
    userId: string;
    conversationId: string;
    lastReadMessageId: string;
  }): Promise<ConversationUserState> {
    const existing = await this.repo.findOne({
      where: { userId: params.userId, conversationId: params.conversationId },
    });

    if (existing) {
      existing.lastReadMessageId = params.lastReadMessageId;
      existing.lastReadAt = new Date();
      return toDomain(await this.repo.save(existing));
    }

    const entity = this.repo.create({
      id: uuidv4(),
      userId: params.userId,
      conversationId: params.conversationId,
      lastReadMessageId: params.lastReadMessageId,
      lastReadAt: new Date(),
    });
    return toDomain(await this.repo.save(entity));
  }
}
