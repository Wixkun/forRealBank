import { News } from '@forreal/domain/feed/News';
import { NewsEntity } from '../entities/NewsEntity';

export class NewsMapper {
  static toPersistence(news: News): NewsEntity {
    const entity = new NewsEntity();
    entity.id = news.id;
    entity.title = news.title;
    entity.content = news.content;
    return entity;
  }

  static toDomain(entity: NewsEntity): News {
    return new News(
      entity.id,
      entity.author?.id ?? null,
      entity.title,
      entity.content,
      entity.createdAt,
    );
  }
}
