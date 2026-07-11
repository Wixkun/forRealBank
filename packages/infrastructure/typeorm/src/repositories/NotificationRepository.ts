import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  INotificationRepository,
  CreateNotificationParams,
  NotificationType,
  NotificationTargetType,
} from '@forreal/domain';
import { NotificationEntity } from '../entities/NotificationEntity';
import { UserEntity } from '../entities/UserEntity';
import { NotificationMapper } from '../mappers/NotificationMapper';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<Notification | null> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['user'] });
    return entity ? NotificationMapper.toDomain(entity) : null;
  }

  async save(notification: Notification): Promise<void> {
    const entity = await this.repo.findOne({
      where: { id: notification.id },
      relations: ['user'],
    });
    if (!entity) throw new NotFoundException('notification not found');
    entity.readAt = notification.readAt;
    entity.isRead = notification.isRead();
    entity.title = notification.title;
    entity.content = notification.content;
    entity.unreadCount = notification.unreadCount;
    await this.repo.save(entity);
  }

  async create(params: CreateNotificationParams): Promise<Notification> {
    const user = await this.userRepo.findOne({ where: { id: params.userId } });
    if (!user) throw new NotFoundException('user not found');

    const entity = this.repo.create({
      id: uuidv4(),
      user,
      title: params.title,
      content: params.content,
      type: params.type,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      targetUrl: params.targetUrl ?? null,
      groupKey: params.groupKey ?? null,
      oldestUnreadMessageId: params.oldestUnreadMessageId ?? null,
      unreadCount: params.unreadCount ?? 1,
      isRead: false,
      readAt: null,
    });

    const saved = await this.repo.save(entity);
    return NotificationMapper.toDomain(saved);
  }

  async listByUser(
    userId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const { limit = 50, offset = 0 } = params ?? {};
    const entities = await this.repo.find({
      where: { user: { id: userId } as any },
      order: { updatedAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['user'],
    });
    return entities.map(NotificationMapper.toDomain);
  }

  async deleteById(id: string, userId: string): Promise<void> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!entity) return;
    if (entity.user.id !== userId) throw new ForbiddenException('not your notification');
    await this.repo.delete({ id });
  }

  async countUnread(userId: string): Promise<number> {
    return this.repo.count({
      where: { user: { id: userId } as any, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    const now = new Date();
    await this.repo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ isRead: true, readAt: now })
      .where('id = :id', { id })
      .andWhere('user_id = :userId', { userId })
      .andWhere('is_read = false')
      .execute();
  }

  async markAllAsRead(userId: string): Promise<number> {
    const now = new Date();
    const result = await this.repo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ isRead: true, readAt: now })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = false')
      .execute();
    return result.affected ?? 0;
  }

  async findUnreadByGroupKey(
    userId: string,
    type: NotificationType,
    groupKey: string,
  ): Promise<Notification | null> {
    const entity = await this.repo.findOne({
      where: {
        user: { id: userId } as any,
        type,
        groupKey,
        isRead: false,
      },
      relations: ['user'],
    });
    return entity ? NotificationMapper.toDomain(entity) : null;
  }

  async markAsReadByTarget(
    userId: string,
    targetType: NotificationTargetType,
    targetId: string,
  ): Promise<number> {
    // Deux façons de relier une notification à l'entité consultée : sa cible
    // directe (target_type/target_id) ou son group_key — utilisé quand le même
    // événement est consultable à plusieurs endroits (ex. un virement reçu :
    // news de détail ET lignes du relevé). Le group_key peut contenir
    // plusieurs jetons « type:id » séparés par des espaces (débit et crédit
    // d'un virement interne) : on matche si l'un d'eux correspond.
    const result = await this.repo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ isRead: true, readAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = false')
      .andWhere(
        `((target_type = :targetType AND target_id = :targetId)
          OR :groupKey = ANY(string_to_array(group_key, ' ')))`,
        {
          targetType,
          targetId,
          groupKey: `${targetType.toLowerCase()}:${targetId}`,
        },
      )
      .execute();
    return result.affected ?? 0;
  }

  async incrementGrouped(id: string, title: string, content: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({
        title,
        content,
        unreadCount: () => 'unread_count + 1',
        updatedAt: new Date(),
      })
      .where('id = :id', { id })
      .execute();
  }
}
