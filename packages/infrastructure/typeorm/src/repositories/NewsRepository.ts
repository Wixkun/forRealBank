import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { INewsRepository, NewsSource, NewsStatus, UserNewsStatusValue } from '@forreal/domain';
import { News } from '@forreal/domain';
import { NewsEntity } from '../entities/NewsEntity';
import { UserNewsStatusEntity } from '../entities/UserNewsStatusEntity';
import { UserEntity } from '../entities/UserEntity';
import { NewsMapper } from '../mappers/NewsMapper';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NewsRepository implements INewsRepository {
  constructor(
    @InjectRepository(NewsEntity)
    private readonly repo: Repository<NewsEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(UserNewsStatusEntity)
    private readonly statusRepo: Repository<UserNewsStatusEntity>,
  ) {}

  async findById(id: string): Promise<News | null> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['author'] });
    return entity ? NewsMapper.toDomain(entity) : null;
  }

  async save(news: News): Promise<void> {
    await this.repo.update({ id: news.id }, {
      title: news.title,
      content: news.content,
      status: news.status,
      userId: news.userId,
    });
  }

  async create(params: {
    authorId: string | null;
    title: string;
    content: string;
    status?: NewsStatus;
    source?: NewsSource;
    userId?: string | null;
    imageUrl?: string | null;
  }): Promise<News> {
    let author: UserEntity | null = null;
    if (params.authorId) {
      author = await this.userRepo.findOne({ where: { id: params.authorId } });
      if (!author) throw new NotFoundException('author not found');
    }
    const entity = this.repo.create({
      id: uuidv4(),
      author,
      userId: params.userId ?? null,
      title: params.title,
      content: params.content,
      status: params.status ?? NewsStatus.INFORMATION,
      source: params.source ?? NewsSource.MANUAL,
      isActive: true,
      imageUrl: params.imageUrl ?? null,
    });
    const saved = await this.repo.save(entity);
    return NewsMapper.toDomain({ ...saved, author } as NewsEntity);
  }

  async list(params?: {
    limit?: number;
    offset?: number;
    userId?: string | null;
    includeArchived?: boolean;
    archivedOnly?: boolean;
  }): Promise<News[]> {
    const { limit = 20, offset = 0, userId, includeArchived = false, archivedOnly = false } = params ?? {};

    if (archivedOnly && !userId) return [];

    const qb = this.repo
      .createQueryBuilder('news')
      .leftJoinAndSelect('news.author', 'author')
      .where('news.is_active = true')
      .orderBy('news.createdAt', 'DESC');

    if (userId) {
      qb.andWhere('(news.user_id IS NULL OR news.user_id = :userId)', { userId });
    } else {
      qb.andWhere('news.user_id IS NULL');
      qb.take(limit).skip(offset);
    }

    const entities = await qb.getMany();

    if (!userId) {
      return entities.map((e) => NewsMapper.toDomain(e));
    }

    // Fetch per-user statuses for these news items
    const newsIds = entities.map((e) => e.id);
    const statuses =
      newsIds.length > 0
        ? await this.statusRepo.find({ where: { userId, newsId: In(newsIds) } })
        : [];

    const statusMap = new Map(statuses.map((s) => [s.newsId, s]));

    const filtered = entities.filter((entity) => {
      const ust = statusMap.get(entity.id);
      const statusVal = ust?.status ?? 'VISIBLE';
      if (archivedOnly) return statusVal === 'ARCHIVED';
      if (!includeArchived) return statusVal !== 'ARCHIVED' && statusVal !== 'DELETED';
      return statusVal !== 'DELETED';
    });

    const paginated = archivedOnly ? filtered : filtered.slice(offset, offset + limit);

    return paginated.map((entity) => {
      const ust = statusMap.get(entity.id);
      return NewsMapper.toDomain(entity, ust?.archivedAt ?? null);
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async deactivateById(id: string): Promise<void> {
    await this.repo.update({ id }, { isActive: false });
  }

  async setUserStatus(newsId: string, userId: string, status: UserNewsStatusValue): Promise<void> {
    const existing = await this.statusRepo.findOne({ where: { newsId, userId } });
    if (existing) {
      existing.status = status;
      if (status === 'READ') existing.readAt = new Date();
      else if (status === 'ARCHIVED') existing.archivedAt = new Date();
      else if (status === 'DELETED') existing.deletedAt = new Date();
      else if (status === 'VISIBLE') {
        existing.readAt = null;
        existing.archivedAt = null;
        existing.deletedAt = null;
      }
      await this.statusRepo.save(existing);
    } else {
      const entity = this.statusRepo.create({
        id: uuidv4(),
        newsId,
        userId,
        status,
        readAt: status === 'READ' ? new Date() : null,
        archivedAt: status === 'ARCHIVED' ? new Date() : null,
        deletedAt: status === 'DELETED' ? new Date() : null,
      });
      await this.statusRepo.save(entity);
    }
  }

  async clearUserStatus(newsId: string, userId: string): Promise<void> {
    await this.statusRepo.delete({ newsId, userId });
  }

  // Backward-compat aliases

  async archiveForUser(newsId: string, userId: string): Promise<void> {
    await this.setUserStatus(newsId, userId, 'ARCHIVED');
  }

  async unarchiveForUser(newsId: string, userId: string): Promise<void> {
    await this.clearUserStatus(newsId, userId);
  }

  async dismissForUser(newsId: string, userId: string): Promise<void> {
    await this.setUserStatus(newsId, userId, 'DELETED');
  }
}
