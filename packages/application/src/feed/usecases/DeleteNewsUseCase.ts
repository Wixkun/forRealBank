import { INewsRepository } from '@forreal/domain';

export class DeleteNewsUseCase {
  constructor(private readonly newsRepository: INewsRepository) {}

  async execute(input: { newsId: string; userId?: string }) {
    const news = await this.newsRepository.findById(input.newsId);
    if (!news) throw new Error('NEWS_NOT_FOUND');

    if (input.userId) {
      if (news.userId && news.userId !== input.userId) {
        throw new Error('FORBIDDEN_CANNOT_DELETE_OTHER_USER_NEWS');
      }
      await this.newsRepository.setUserStatus(input.newsId, input.userId, 'DELETED');
    } else {
      await this.newsRepository.deleteById(input.newsId);
    }

    return { success: true };
  }
}
