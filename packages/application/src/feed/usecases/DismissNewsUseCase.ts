import { INewsRepository } from '@forreal/domain';

export class DismissNewsUseCase {
  constructor(private readonly newsRepository: INewsRepository) {}

  async execute({ newsId, userId }: { newsId: string; userId: string }) {
    const news = await this.newsRepository.findById(newsId);
    if (!news) throw new Error('NEWS_NOT_FOUND');
    await this.newsRepository.dismissForUser(newsId, userId);
    return { success: true };
  }
}
