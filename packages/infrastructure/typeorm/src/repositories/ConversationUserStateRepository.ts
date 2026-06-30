import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationUserState, IConversationUserStateRepository } from '@forreal/domain';
import { ConversationUserStateEntity } from '../entities/ConversationUserStateEntity';
import { ConversationUserStateMapper } from '../mappers/ConversationUserStateMapper';
import { v4 as uuidv4 } from 'uuid';

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
    return entity ? ConversationUserStateMapper.toDomain(entity) : null;
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
      const saved = await this.repo.save(existing);
      return ConversationUserStateMapper.toDomain(saved);
    }

    const entity = this.repo.create({
      id: uuidv4(),
      userId: params.userId,
      conversationId: params.conversationId,
      lastReadMessageId: params.lastReadMessageId,
      lastReadAt: new Date(),
    });
    const saved = await this.repo.save(entity);
    return ConversationUserStateMapper.toDomain(saved);
  }
}
