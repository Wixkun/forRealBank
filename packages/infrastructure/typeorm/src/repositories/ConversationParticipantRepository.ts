import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IConversationParticipantRepository } from '@forreal/domain/chat/ports/IConversationParticipantRepository';
import { ConversationParticipant } from '@forreal/domain/chat/ConversationParticipant';
import { ConversationParticipantEntity } from '../entities/ConversationParticipantEntity';
import { ConversationEntity } from '../entities/ConversationEntity';
import { UserEntity } from '../entities/UserEntity';
import { ConversationParticipantMapper } from '../mappers/ConversationParticipantMapper';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConversationParticipantRepository implements IConversationParticipantRepository {
  constructor(
    @InjectRepository(ConversationParticipantEntity)
    private readonly repo: Repository<ConversationParticipantEntity>,
    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<ConversationParticipant | null> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['conversation', 'user'] });
    return entity ? ConversationParticipantMapper.toDomain(entity) : null;
  }

  async save(participant: ConversationParticipant): Promise<void> {
    const entity = ConversationParticipantMapper.toPersistence(participant);
    await this.repo.save(entity);
  }

  async addParticipant(conversationId: string, userId: string): Promise<ConversationParticipant> {
    const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!conversation || !user) throw new NotFoundException('conversation or user not found');

    const entity = this.repo.create({ id: uuidv4(), conversation, user });
    try {
      const saved = await this.repo.save(entity);
      return ConversationParticipantMapper.toDomain(saved);
    } catch (e) {
      throw new BadRequestException('user already in conversation');
    }
  }

  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    await this.repo.delete({ conversation: { id: conversationId } as any, user: { id: userId } as any });
  }

  async listByConversation(conversationId: string): Promise<ConversationParticipant[]> {
    const entities = await this.repo.find({ where: { conversation: { id: conversationId } as any }, relations: ['conversation', 'user'] });
    return entities.map(ConversationParticipantMapper.toDomain);
  }

  async listByUser(userId: string): Promise<ConversationParticipant[]> {
    const entities = await this.repo.find({ where: { user: { id: userId } as any }, relations: ['conversation', 'user'] });
    return entities.map(ConversationParticipantMapper.toDomain);
  }
}
