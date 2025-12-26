import { Injectable, Inject } from '@nestjs/common';
import { CreateNewsUseCase } from '@forreal/application/feed/usecases/CreateNewsUseCase';
import { ListNewsUseCase } from '@forreal/application/feed/usecases/ListNewsUseCase';
import { DeleteNewsUseCase } from '@forreal/application/feed/usecases/DeleteNewsUseCase';

@Injectable()
export class NewsService {
  constructor(
    @Inject(CreateNewsUseCase) private readonly createNewsUC: CreateNewsUseCase,
    @Inject(ListNewsUseCase) private readonly listNewsUC: ListNewsUseCase,
    @Inject(DeleteNewsUseCase) private readonly deleteNewsUC: DeleteNewsUseCase,
  ) {}

  async createNews(authorId: string, title: string, content: string) {
    return this.createNewsUC.execute({ authorId, title, content });
  }

  async listNews(limit = 20, offset = 0) {
    return this.listNewsUC.execute({ limit, offset });
  }

  async deleteNews(id: string) {
    return this.deleteNewsUC.execute({ newsId: id });
  }
}
