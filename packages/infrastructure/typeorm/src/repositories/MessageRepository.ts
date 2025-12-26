import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMessageRepository } from '@forreal/domain/chat/ports/IMessageRepository';
import { Message } from '@forreal/domain/chat/Message';
import { MessageEntity } from '../entities/MessageEntity';
import { ConversationEntity } from '../entities/ConversationEntity';
import { UserEntity } from '../entities/UserEntity';
import { MessageMapper } from '../mappers/MessageMapper';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MessageRepository implements IMessageRepository {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly repo: Repository<MessageEntity>,
    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<Message | null> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['conversation', 'sender'] });
    return entity ? MessageMapper.toDomain(entity) : null;
  }

  async save(message: Message): Promise<void> {
    const entity = await this.repo.findOne({ where: { id: message.id }, relations: ['conversation', 'sender'] });
    if (!entity) throw new NotFoundException('message not found');
    entity.readAt = message.readAt;
    await this.repo.save(entity);
  }

  async create(conversationId: string, senderId: string, content: string): Promise<Message> {
    const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });
    const sender = await this.userRepo.findOne({ where: { id: senderId } });
    if (!conversation || !sender) throw new NotFoundException('conversation or sender not found');

    const entity = this.repo.create({ id: uuidv4(), conversation, sender, content });
    const saved = await this.repo.save(entity);
    return MessageMapper.toDomain(saved);
  }

  async listByConversation(conversationId: string, params?: { limit?: number; offset?: number }): Promise<Message[]> {
    const { limit = 50, offset = 0 } = params ?? {};
    const entities = await this.repo.find({
      where: { conversation: { id: conversationId } as any },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
      relations: ['conversation', 'sender'],
    });
    return entities.map(MessageMapper.toDomain);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
