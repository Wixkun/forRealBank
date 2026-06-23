import { INewsRepository } from '@forreal/domain';

export class ArchiveNewsUseCase {
  constructor(private readonly newsRepository: INewsRepository) {}

  async execute({ newsId }: { newsId: string }) {
    const news = await this.newsRepository.findById(newsId);
    if (!news) throw new Error('NEWS_NOT_FOUND');
    await this.newsRepository.archiveById(newsId);
    return { success: true };
  }
}
