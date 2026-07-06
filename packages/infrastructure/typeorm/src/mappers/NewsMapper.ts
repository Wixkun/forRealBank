import { News, NewsSource, NewsStatus } from '@forreal/domain';
import { NewsEntity } from '../entities/NewsEntity';

export class NewsMapper {
  static toPersistence(news: News): Partial<NewsEntity> {
    return {
      id: news.id,
      title: news.title,
      subtitle: news.subtitle,
      content: news.content,
      status: news.status,
      userId: news.userId,
      imageUrl: news.imageUrl,
    };
  }

  static toDomain(entity: NewsEntity, userArchivedAt: Date | null = null): News {
    return new News(
      entity.id,
      entity.author?.id ?? null,
      entity.title,
      entity.content,
      entity.createdAt,
      (entity.status as NewsStatus) ?? NewsStatus.INFORMATION,
      entity.userId ?? null,
      userArchivedAt,
      (entity.source as NewsSource) ?? NewsSource.MANUAL,
      entity.isActive ?? true,
      entity.imageUrl ?? null,
      entity.subtitle ?? null,
    );
  }
}
