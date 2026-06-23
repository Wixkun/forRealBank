import { INewsRepository } from '@forreal/domain';

export class ListNewsUseCase {
  constructor(private readonly newsRepository: INewsRepository) {}

  async execute(input: {
    limit?: number;
    offset?: number;
    userId?: string | null;
    includeArchived?: boolean;
  }) {
    const newsList = await this.newsRepository.list({
      limit: input.limit,
      offset: input.offset,
      userId: input.userId,
      includeArchived: input.includeArchived ?? false,
    });
    return newsList.map((n) => ({
      id: n.id,
      authorId: n.authorId,
      userId: n.userId,
      title: n.title,
      content: n.content,
      status: n.status,
      createdAt: n.createdAt,
      archivedAt: n.archivedAt,
    }));
  }
}
