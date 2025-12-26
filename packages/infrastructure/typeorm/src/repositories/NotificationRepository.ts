import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INotificationRepository } from '@forreal/domain/notifications/ports/INotificationRepository';
import { Notification } from '@forreal/domain/notifications/Notification';
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
    const entity = await this.repo.findOne({ where: { id: notification.id }, relations: ['user'] });
    if (!entity) throw new NotFoundException('notification not found');
    entity.readAt = notification.readAt;
    await this.repo.save(entity);
  }

  async create(userId: string, title: string, content: string, type: string): Promise<Notification> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('user not found');
    const entity = this.repo.create({ id: uuidv4(), user, title, content, type });
    const saved = await this.repo.save(entity);
    return NotificationMapper.toDomain(saved);
  }

  async listByUser(userId: string, params?: { limit?: number; offset?: number }): Promise<Notification[]> {
    const { limit = 50, offset = 0 } = params ?? {};
    const entities = await this.repo.find({
      where: { user: { id: userId } as any },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['user'],
    });
    return entities.map(NotificationMapper.toDomain);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
