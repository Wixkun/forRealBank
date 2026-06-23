import { News, NewsStatus } from '@forreal/domain';
import { NewsEntity } from '../entities/NewsEntity';

export class NewsMapper {
  static toPersistence(news: News): Partial<NewsEntity> {
    return {
      id: news.id,
      title: news.title,
      content: news.content,
      status: news.status,
      userId: news.userId,
      archivedAt: news.archivedAt,
    };
  }

  static toDomain(entity: NewsEntity): News {
    return new News(
      entity.id,
      entity.author?.id ?? null,
      entity.title,
      entity.content,
      entity.createdAt,
      (entity.status as NewsStatus) ?? NewsStatus.INFORMATION,
      entity.userId ?? null,
      entity.archivedAt ?? null,
    );
  }
}
