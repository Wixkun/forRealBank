import { INewsRepository } from '@forreal/domain';

export class UpdateNewsUseCase {
  constructor(private readonly newsRepository: INewsRepository) {}

  async execute(input: { newsId: string; title?: string; content?: string }) {
    const news = await this.newsRepository.findById(input.newsId);
    if (!news) throw new Error('NEWS_NOT_FOUND');

    if (input.title !== undefined) news.updateTitle(input.title);
    if (input.content !== undefined) news.updateContent(input.content);

    await this.newsRepository.save(news);

    return {
      newsId: news.id,
      title: news.title,
      content: news.content,
      createdAt: news.createdAt,
    };
  }
}
