import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConversationNotificationSettings,
  IConversationNotificationSettingsRepository,
} from '@forreal/domain';
import { ConversationNotificationSettingsEntity } from '../entities/ConversationNotificationSettingsEntity';
import { ConversationNotificationSettingsMapper } from '../mappers/ConversationNotificationSettingsMapper';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConversationNotificationSettingsRepository
  implements IConversationNotificationSettingsRepository
{
  constructor(
    @InjectRepository(ConversationNotificationSettingsEntity)
    private readonly repo: Repository<ConversationNotificationSettingsEntity>,
  ) {}

  async findByUserAndConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationNotificationSettings | null> {
    const entity = await this.repo.findOne({ where: { userId, conversationId } });
    return entity ? ConversationNotificationSettingsMapper.toDomain(entity) : null;
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
      const saved = await this.repo.save(existing);
      return ConversationNotificationSettingsMapper.toDomain(saved);
    }

    const entity = this.repo.create({
      id: uuidv4(),
      userId: params.userId,
      conversationId: params.conversationId,
      muted: params.muted,
      mutedUntil: params.mutedUntil ?? null,
    });
    const saved = await this.repo.save(entity);
    return ConversationNotificationSettingsMapper.toDomain(saved);
  }
}
