import { Injectable, Inject } from '@nestjs/common';
import { Subject } from 'rxjs';
import { CreateNewsUseCase } from '@forreal/application/feed/usecases/CreateNewsUseCase';
import { ListNewsUseCase } from '@forreal/application/feed/usecases/ListNewsUseCase';
import { DeleteNewsUseCase } from '@forreal/application/feed/usecases/DeleteNewsUseCase';

@Injectable()
export class NewsService {
  private newsChangeSubject = new Subject<unknown>();

  constructor(
    @Inject(CreateNewsUseCase) private readonly createNewsUC: CreateNewsUseCase,
    @Inject(ListNewsUseCase) private readonly listNewsUC: ListNewsUseCase,
    @Inject(DeleteNewsUseCase) private readonly deleteNewsUC: DeleteNewsUseCase,
  ) {}

  async createNews(authorId: string, title: string, content: string) {
    const result = await this.createNewsUC.execute({ authorId, title, content });
    const allNews = await this.listNewsUC.execute({ limit: 10, offset: 0 });
    this.newsChangeSubject.next(allNews);
    return result;
  }

  async listNews(limit = 20, offset = 0) {
    return this.listNewsUC.execute({ limit, offset });
  }

  async deleteNews(id: string) {
    const result = await this.deleteNewsUC.execute({ newsId: id });
    const allNews = await this.listNewsUC.execute({ limit: 10, offset: 0 });
    this.newsChangeSubject.next(allNews);
    return result;
  }

  getNewsChangeObservable() {
    return this.newsChangeSubject.asObservable();
  }
}
