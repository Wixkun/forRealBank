import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { Subject } from 'rxjs';
import {
  CreateNewsUseCase,
  ListNewsUseCase,
  DeleteNewsUseCase,
  UpdateNewsUseCase,
  ArchiveNewsUseCase,
  UnarchiveNewsUseCase,
  DismissNewsUseCase,
} from '@forreal/application';
import { INewsRepository, NewsStatus } from '@forreal/domain';

@Injectable()
export class NewsService {
  private newsChangeSubject = new Subject<unknown>();

  constructor(
    @Inject(CreateNewsUseCase) private readonly createNewsUC: CreateNewsUseCase,
    @Inject(ListNewsUseCase) private readonly listNewsUC: ListNewsUseCase,
    @Inject(DeleteNewsUseCase) private readonly deleteNewsUC: DeleteNewsUseCase,
    @Inject(UpdateNewsUseCase) private readonly updateNewsUC: UpdateNewsUseCase,
    @Inject(ArchiveNewsUseCase) private readonly archiveNewsUC: ArchiveNewsUseCase,
    @Inject(UnarchiveNewsUseCase) private readonly unarchiveNewsUC: UnarchiveNewsUseCase,
    @Inject(DismissNewsUseCase) private readonly dismissNewsUC: DismissNewsUseCase,
    @Inject(INewsRepository) private readonly newsRepo: INewsRepository,
  ) {}

  async createNews(
    authorId: string,
    title: string,
    content: string,
    status?: NewsStatus,
    userId?: string | null,
  ) {
    const result = await this.createNewsUC.execute({ authorId, title, content, status, userId });
    await this.broadcastUpdate(userId);
    return result;
  }

  async createSystemNews(params: {
    authorId: string;
    title: string;
    content: string;
    status: NewsStatus;
    userId: string;
  }) {
    const result = await this.newsRepo.create({
      authorId: params.authorId,
      title: params.title,
      content: params.content,
      status: params.status,
      userId: params.userId,
    });
    this.newsChangeSubject.next(result);
    return result;
  }

  async listNews(limit = 20, offset = 0, userId?: string | null) {
    return this.listNewsUC.execute({ limit, offset, userId });
  }

  async deleteNews(id: string, requesterId?: string) {
    const news = await this.newsRepo.findById(id);
    if (!news) throw new ForbiddenException('News not found');
    // Owner or anyone can delete their own user-specific news
    if (news.userId && news.userId !== requesterId) {
      throw new ForbiddenException('Cannot delete this news item');
    }
    const result = await this.deleteNewsUC.execute({ newsId: id });
    await this.broadcastUpdate();
    return result;
  }

  async archiveNews(id: string) {
    const result = await this.archiveNewsUC.execute({ newsId: id });
    await this.broadcastUpdate();
    return result;
  }

  async unarchiveNews(id: string) {
    const result = await this.unarchiveNewsUC.execute({ newsId: id });
    await this.broadcastUpdate();
    return result;
  }

  async dismissNews(newsId: string, userId: string) {
    return this.dismissNewsUC.execute({ newsId, userId });
  }

  async updateNews(id: string, input: { title?: string; content?: string }) {
    const result = await this.updateNewsUC.execute({ newsId: id, ...input });
    await this.broadcastUpdate();
    return result;
  }

  getNewsChangeObservable() {
    return this.newsChangeSubject.asObservable();
  }

  private async broadcastUpdate(userId?: string | null) {
    const allNews = await this.listNewsUC.execute({ limit: 20, offset: 0, userId });
    this.newsChangeSubject.next(allNews);
  }
}
