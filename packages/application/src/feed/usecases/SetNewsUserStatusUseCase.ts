import { INewsRepository } from '@forreal/domain';

export class SetNewsUserStatusUseCase {
  constructor(private readonly newsRepository: INewsRepository) {}

  async execute({
    newsId,
    userId,
    status,
  }: {
    newsId: string;
    userId: string;
    status: 'READ' | 'ARCHIVED' | 'DELETED' | null;
  }) {
    const news = await this.newsRepository.findById(newsId);
    if (!news) throw new Error('NEWS_NOT_FOUND');

    if (news.userId && news.userId !== userId) throw new Error('FORBIDDEN');

    if (status === null) {
      await this.newsRepository.clearUserStatus(newsId, userId);
    } else {
      await this.newsRepository.setUserStatus(newsId, userId, status);
    }
    return { success: true };
  }
}
