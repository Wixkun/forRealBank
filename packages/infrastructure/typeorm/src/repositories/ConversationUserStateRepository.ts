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
    entity.hiddenAt,
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

  async setHidden(userId: string, conversationId: string, hidden: boolean): Promise<void> {
    const hiddenAt = hidden ? new Date() : null;
    const existing = await this.repo.findOne({ where: { userId, conversationId } });
    if (existing) {
      existing.hiddenAt = hiddenAt;
      await this.repo.save(existing);
      return;
    }
    await this.repo.save(
      this.repo.create({
        id: uuidv4(),
        userId,
        conversationId,
        lastReadMessageId: null,
        lastReadAt: null,
        hiddenAt,
      }),
    );
  }

  async listHiddenConversationIds(userId: string): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('state')
      .select('state.conversation_id', 'conversationId')
      .where('state.user_id = :userId', { userId })
      .andWhere('state.hidden_at IS NOT NULL')
      .getRawMany<{ conversationId: string }>();
    return rows.map((r) => r.conversationId);
  }

  async clearHiddenForConversation(conversationId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(ConversationUserStateEntity)
      .set({ hiddenAt: null })
      .where('conversation_id = :conversationId AND hidden_at IS NOT NULL', { conversationId })
      .execute();
  }
}
