import { INewsRepository } from '@forreal/domain';

export class MarkAsReadUseCase {
  constructor(private readonly newsRepository: INewsRepository) {}

  async execute({ newsId, userId }: { newsId: string; userId: string }) {
    const news = await this.newsRepository.findById(newsId);
    if (!news) throw new Error('NEWS_NOT_FOUND');

    if (news.userId && news.userId !== userId) {
      throw new Error('FORBIDDEN_CANNOT_READ_OTHER_USER_NEWS');
    }

    await this.newsRepository.setUserStatus(newsId, userId, 'READ');
    return { success: true };
  }
}
