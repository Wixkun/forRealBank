import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IConversationRepository } from '@forreal/domain';
import { Conversation, ConversationType } from '@forreal/domain';
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

  async create(type: ConversationType, name?: string | null): Promise<Conversation> {
    const entity = this.repo.create({ id: uuidv4(), type, name: name ?? null });
    const saved = await this.repo.save(entity);
    return ConversationMapper.toDomain(saved);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async findPrivateBetween(userIdA: string, userIdB: string): Promise<Conversation | null> {
    // Jointure double sur les participants : conversation PRIVÉE contenant les
    // deux utilisateurs (les privées ont exactement 2 membres par construction).
    const entity = await this.repo
      .createQueryBuilder('conversation')
      .innerJoin(
        'conversation_participants',
        'pa',
        'pa.conversation_id = conversation.id AND pa.user_id = :userIdA',
        { userIdA },
      )
      .innerJoin(
        'conversation_participants',
        'pb',
        'pb.conversation_id = conversation.id AND pb.user_id = :userIdB',
        { userIdB },
      )
      .where('conversation.type = :type', { type: ConversationType.PRIVATE })
      .orderBy('conversation.createdAt', 'ASC')
      .getOne();
    return entity ? ConversationMapper.toDomain(entity) : null;
  }
}
