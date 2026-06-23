import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INewsRepository, NewsStatus } from '@forreal/domain';
import { News } from '@forreal/domain';
import { NewsEntity } from '../entities/NewsEntity';
import { NewsDismissalEntity } from '../entities/NewsDismissalEntity';
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
    @InjectRepository(NewsDismissalEntity)
    private readonly dismissalRepo: Repository<NewsDismissalEntity>,
  ) {}

  async findById(id: string): Promise<News | null> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['author'] });
    return entity ? NewsMapper.toDomain(entity) : null;
  }

  async save(news: News): Promise<void> {
    await this.repo.update({ id: news.id }, NewsMapper.toPersistence(news));
  }

  async create(params: {
    authorId: string | null;
    title: string;
    content: string;
    status?: NewsStatus;
    userId?: string | null;
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
      archivedAt: null,
    });
    const saved = await this.repo.save(entity);
    return NewsMapper.toDomain({ ...saved, author } as NewsEntity);
  }

  async list(params?: {
    limit?: number;
    offset?: number;
    userId?: string | null;
    includeArchived?: boolean;
  }): Promise<News[]> {
    const { limit = 20, offset = 0, userId, includeArchived = false } = params ?? {};

    const qb = this.repo
      .createQueryBuilder('news')
      .leftJoinAndSelect('news.author', 'author')
      .orderBy('news.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (!includeArchived) {
      qb.andWhere('news.archived_at IS NULL');
    }

    // Global news (userId IS NULL) OR user-specific news for this user
    if (userId) {
      qb.andWhere('(news.user_id IS NULL OR news.user_id = :userId)', { userId });
      // Exclude news dismissed by this user
      qb.andWhere(
        'news.id NOT IN (SELECT d.news_id FROM news_dismissals d WHERE d.user_id = :userId)',
        { userId },
      );
    } else {
      qb.andWhere('news.user_id IS NULL');
    }

    const entities = await qb.getMany();
    return entities.map(NewsMapper.toDomain);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async archiveById(id: string): Promise<void> {
    await this.repo.update({ id }, { archivedAt: new Date() });
  }

  async unarchiveById(id: string): Promise<void> {
    await this.repo.update({ id }, { archivedAt: null });
  }

  async dismissForUser(newsId: string, userId: string): Promise<void> {
    await this.dismissalRepo
      .createQueryBuilder()
      .insert()
      .into(NewsDismissalEntity)
      .values({ id: uuidv4(), newsId, userId })
      .orIgnore() // ignore si déjà dismissed (contrainte unique)
      .execute();
  }
}
