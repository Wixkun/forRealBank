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

// Signal de changement du fil : userId null = changement public (tout le
// monde relit sa liste), sinon seul l'utilisateur concerné est notifié.
// Le sujet ne transporte JAMAIS le contenu d'une news : chaque connexion SSE
// relit sa propre liste filtrée côté serveur (confidentialité).
export interface NewsChangeEvent {
  userId: string | null;
}

@Injectable()
export class NewsService {
  private newsChangeSubject = new Subject<NewsChangeEvent>();

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
    subtitle?: string | null,
  ) {
    const result = await this.createNewsUC.execute({
      authorId,
      title,
      subtitle,
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
    subtitle?: string | null;
    content: string;
    status: NewsStatus;
    metadata?: Record<string, unknown> | null;
  }) {
    const result = await this.newsRepo.create({
      authorId: null,
      title: params.title,
      subtitle: params.subtitle ?? null,
      content: params.content,
      status: params.status,
      source: NewsSource.AUTOMATIC,
      userId: params.targetUserId,
      metadata: params.metadata ?? null,
    });
    // News privée : ne notifier que son destinataire
    this.newsChangeSubject.next({ userId: params.targetUserId });
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

  async getNewsById(id: string, requestingUserId?: string | null) {
    const news = await this.newsRepo.findById(id);
    if (!news || !news.isActive) return null;
    // News ciblée (privée) : seul son destinataire peut la consulter. Sinon un
    // utilisateur pourrait lire les news privées d'autrui (détails de virement,
    // IBAN…) en devinant leur identifiant.
    if (news.userId && news.userId !== requestingUserId) return null;
    return {
      id: news.id,
      authorId: news.authorId,
      userId: news.userId,
      title: news.title,
      subtitle: news.subtitle,
      content: news.content,
      status: news.status,
      createdAt: news.createdAt,
      archivedAt: news.archivedAt,
      imageUrl: news.imageUrl,
      metadata: news.metadata,
    };
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

  private async broadcastUpdate(userId: string | null = null) {
    this.newsChangeSubject.next({ userId });
  }
}
