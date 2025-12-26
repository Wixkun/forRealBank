import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INewsRepository } from '@forreal/domain/feed/ports/INewsRepository';
import { News } from '@forreal/domain/feed/News';
import { NewsEntity } from '../entities/NewsEntity';
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
  ) {}

  async findById(id: string): Promise<News | null> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['author'] });
    return entity ? NewsMapper.toDomain(entity) : null;
  }

  async save(news: News): Promise<void> {
    const entity = NewsMapper.toPersistence(news);
    await this.repo.save(entity);
  }

  async create(authorId: string | null, title: string, content: string): Promise<News> {
    let author: UserEntity | null = null;
    if (authorId) {
      author = await this.userRepo.findOne({ where: { id: authorId } });
      if (!author) throw new NotFoundException('author not found');
    }
    const entity = this.repo.create({ id: uuidv4(), author, title, content });
    const saved = await this.repo.save(entity);
    return NewsMapper.toDomain(saved);
  }

  async list(params?: { limit?: number; offset?: number }): Promise<News[]> {
    const { limit = 20, offset = 0 } = params ?? {};
    const entities = await this.repo.find({ order: { createdAt: 'DESC' }, take: limit, skip: offset, relations: ['author'] });
    return entities.map(NewsMapper.toDomain);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
