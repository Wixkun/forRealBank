import { INewsRepository } from '@forreal/domain/feed/ports/INewsRepository';

export class ListNewsUseCase {
  constructor(private readonly newsRepository: INewsRepository) {}

  async execute(input: { limit?: number; offset?: number }) {
    const newsList = await this.newsRepository.list({ limit: input.limit, offset: input.offset });
    return newsList.map(n => ({
      id: n.id,
      authorId: n.authorId,
      title: n.title,
      content: n.content,
      createdAt: n.createdAt,
    }));
  }
}
