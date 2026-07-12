import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConversationNotificationSettings,
  IConversationNotificationSettingsRepository,
} from '@forreal/domain';
import { ConversationNotificationSettingsEntity } from '../entities/ConversationNotificationSettingsEntity';
import { v4 as uuidv4 } from 'uuid';

function toDomain(
  entity: ConversationNotificationSettingsEntity,
): ConversationNotificationSettings {
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

@Injectable()
export class ConversationNotificationSettingsRepository implements IConversationNotificationSettingsRepository {
  constructor(
    @InjectRepository(ConversationNotificationSettingsEntity)
    private readonly repo: Repository<ConversationNotificationSettingsEntity>,
  ) {}

  async findByUserAndConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationNotificationSettings | null> {
    const entity = await this.repo.findOne({ where: { userId, conversationId } });
    return entity ? toDomain(entity) : null;
  }

  async upsert(params: {
    userId: string;
    conversationId: string;
    muted: boolean;
    mutedUntil?: Date | null;
  }): Promise<ConversationNotificationSettings> {
    const existing = await this.repo.findOne({
      where: { userId: params.userId, conversationId: params.conversationId },
    });

    if (existing) {
      existing.muted = params.muted;
      existing.mutedUntil = params.mutedUntil ?? null;
      return toDomain(await this.repo.save(existing));
    }

    const entity = this.repo.create({
      id: uuidv4(),
      userId: params.userId,
      conversationId: params.conversationId,
      muted: params.muted,
      mutedUntil: params.mutedUntil ?? null,
    });
    return toDomain(await this.repo.save(entity));
  }

  async listMutedConversationIds(userId: string): Promise<string[]> {
    const rows: Array<{ conversation_id: string }> = await this.repo
      .createQueryBuilder('s')
      .select('s.conversation_id', 'conversation_id')
      .where('s.user_id = :userId', { userId })
      .andWhere('s.muted = true')
      .andWhere('(s.muted_until IS NULL OR s.muted_until > now())')
      .getRawMany();
    return rows.map((r) => r.conversation_id);
  }
}
