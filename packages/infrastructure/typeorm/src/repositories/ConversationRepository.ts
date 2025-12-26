import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IConversationRepository } from '@forreal/domain/chat/ports/IConversationRepository';
import { Conversation, ConversationType } from '@forreal/domain/chat/Conversation';
import { ConversationEntity } from '../entities/ConversationEntity';
import { ConversationMapper } from '../mappers/ConversationMapper';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConversationRepository implements IConversationRepository {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly repo: Repository<ConversationEntity>,
  ) {}

  async findById(id: string): Promise<Conversation | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? ConversationMapper.toDomain(entity) : null;
  }

  async save(conversation: Conversation): Promise<void> {
    const entity = ConversationMapper.toPersistence(conversation);
    await this.repo.save(entity);
  }

  async create(type: ConversationType): Promise<Conversation> {
    const entity = this.repo.create({ id: uuidv4(), type });
    const saved = await this.repo.save(entity);
    return ConversationMapper.toDomain(saved);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
