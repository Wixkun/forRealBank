import { INewsRepository } from '@forreal/domain/feed/ports/INewsRepository';

export class DeleteNewsUseCase {
  constructor(private readonly newsRepository: INewsRepository) {}

  async execute(input: { newsId: string }) {
    await this.newsRepository.deleteById(input.newsId);
    return { success: true };
  }
}
