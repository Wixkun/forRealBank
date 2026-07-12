import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMessageRepository, ConversationSummary } from '@forreal/domain';
import { Message } from '@forreal/domain';
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
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['conversation', 'sender'],
    });
    return entity ? MessageMapper.toDomain(entity) : null;
  }

  async save(message: Message): Promise<void> {
    const entity = await this.repo.findOne({
      where: { id: message.id },
      relations: ['conversation', 'sender'],
    });
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

  async listByConversation(
    conversationId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Message[]> {
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

  async summarizeForUser(
    userId: string,
    conversationIds: string[],
  ): Promise<Record<string, ConversationSummary>> {
    const result: Record<string, ConversationSummary> = {};
    if (conversationIds.length === 0) return result;

    // Non lus : messages émis par d'autres, postérieurs à la dernière lecture
    // de l'utilisateur (ou tous si jamais lue). Une seule requête agrégée.
    const unreadRows: Array<{ cid: string; n: string }> = await this.repo.query(
      `SELECT m.conversation_id AS cid, COUNT(*)::int AS n
         FROM messages m
         LEFT JOIN conversation_user_state s
           ON s.conversation_id = m.conversation_id AND s.user_id = $1
        WHERE m.conversation_id = ANY($2)
          AND m.sender_id <> $1
          AND (s.last_read_at IS NULL OR m.created_at > s.last_read_at)
        GROUP BY m.conversation_id`,
      [userId, conversationIds],
    );

    // Dernier message par conversation (DISTINCT ON). Une seule requête.
    const lastRows: Array<{ cid: string; content: string; created_at: Date }> =
      await this.repo.query(
        `SELECT DISTINCT ON (m.conversation_id)
                m.conversation_id AS cid, m.content, m.created_at
           FROM messages m
          WHERE m.conversation_id = ANY($1)
          ORDER BY m.conversation_id, m.created_at DESC`,
        [conversationIds],
      );

    for (const id of conversationIds) {
      result[id] = { unreadCount: 0, lastMessageContent: null, lastMessageAt: null };
    }
    for (const row of unreadRows) {
      result[row.cid] = { ...result[row.cid], unreadCount: Number(row.n) };
    }
    for (const row of lastRows) {
      result[row.cid] = {
        ...result[row.cid],
        lastMessageContent: row.content,
        lastMessageAt: row.created_at,
      };
    }
    return result;
  }
}
