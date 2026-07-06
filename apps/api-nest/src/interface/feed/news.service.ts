import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { Subject } from 'rxjs';
import {
  CreateNewsUseCase,
  ListNewsUseCase,
  DeleteNewsUseCase,
  UpdateNewsUseCase,
  SetNewsUserStatusUseCase,
} from '@forreal/application';
import { INewsRepository, NewsSource, NewsStatus } from '@forreal/domain';

@Injectable()
export class NewsService {
  private newsChangeSubject = new Subject<unknown>();

  constructor(
    @Inject(CreateNewsUseCase) private readonly createNewsUC: CreateNewsUseCase,
    @Inject(ListNewsUseCase) private readonly listNewsUC: ListNewsUseCase,
    @Inject(DeleteNewsUseCase) private readonly deleteNewsUC: DeleteNewsUseCase,
    @Inject(UpdateNewsUseCase) private readonly updateNewsUC: UpdateNewsUseCase,
    @Inject(SetNewsUserStatusUseCase) private readonly setStatusUC: SetNewsUserStatusUseCase,
    @Inject(INewsRepository) private readonly newsRepo: INewsRepository,
  ) {}

  // ─── Création manuelle (DIRECTOR / ADVISOR) ───────────────────────────────

  async createManualNews(
    authorId: string,
    title: string,
    content: string,
    status?: NewsStatus,
    imageUrl?: string | null,
  ) {
    const result = await this.createNewsUC.execute({
      authorId,
      title,
      content,
      status,
      source: NewsSource.MANUAL,
      imageUrl,
    });
    await this.broadcastUpdate();
    return result;
  }

  // ─── Création automatique (backend uniquement) ────────────────────────────

  async createAutomaticNews(params: {
    targetUserId: string;
    title: string;
    content: string;
    status: NewsStatus;
  }) {
    const result = await this.newsRepo.create({
      authorId: null,
      title: params.title,
      content: params.content,
      status: params.status,
      source: NewsSource.AUTOMATIC,
      userId: params.targetUserId,
    });
    this.newsChangeSubject.next(result);
    return result;
  }

  // ─── Lecture ──────────────────────────────────────────────────────────────

  async listNews(
    limit = 20,
    offset = 0,
    userId?: string | null,
    includeArchived = false,
    archivedOnly = false,
  ) {
    return this.listNewsUC.execute({ limit, offset, userId, includeArchived, archivedOnly });
  }

  // ─── Actions utilisateur (per-user) ──────────────────────────────────────

  async archiveNews(newsId: string, userId: string) {
    return this.setStatusUC.execute({ newsId, userId, status: 'ARCHIVED' });
  }

  async unarchiveNews(newsId: string, userId: string) {
    return this.setStatusUC.execute({ newsId, userId, status: null });
  }

  async deleteNewsForUser(newsId: string, userId: string) {
    return this.setStatusUC.execute({ newsId, userId, status: 'DELETED' });
  }

  async markAsRead(newsId: string, userId: string) {
    return this.setStatusUC.execute({ newsId, userId, status: 'READ' });
  }

  // ─── Opérations admin ────────────────────────────────────────────────────

  async deactivateNews(id: string) {
    const news = await this.newsRepo.findById(id);
    if (!news) throw new ForbiddenException('News not found');
    await this.newsRepo.deactivateById(id);
    await this.broadcastUpdate();
    return { success: true };
  }

  async updateNews(id: string, input: { title?: string; content?: string }) {
    const result = await this.updateNewsUC.execute({ newsId: id, ...input });
    await this.broadcastUpdate();
    return result;
  }

  // ─── SSE ─────────────────────────────────────────────────────────────────

  getNewsChangeObservable() {
    return this.newsChangeSubject.asObservable();
  }

  private async broadcastUpdate(userId?: string | null) {
    const allNews = await this.listNewsUC.execute({ limit: 20, offset: 0, userId });
    this.newsChangeSubject.next(allNews);
  }
}
