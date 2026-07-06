import { News, NewsSource, NewsStatus } from '../News';

export const INewsRepository = Symbol('INewsRepository');

export type UserNewsStatusValue = 'VISIBLE' | 'READ' | 'ARCHIVED' | 'DELETED';

export interface INewsRepository {
  findById(id: string): Promise<News | null>;
  save(news: News): Promise<void>;
  create(params: {
    authorId: string | null;
    title: string;
    subtitle?: string | null;
    content: string;
    status?: NewsStatus;
    source?: NewsSource;
    userId?: string | null;
    imageUrl?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<News>;
  list(params?: {
    limit?: number;
    offset?: number;
    userId?: string | null;
    includeArchived?: boolean;
    archivedOnly?: boolean;
  }): Promise<News[]>;
  deleteById(id: string): Promise<void>;
  deactivateById(id: string): Promise<void>;
  setUserStatus(newsId: string, userId: string, status: UserNewsStatusValue): Promise<void>;
  clearUserStatus(newsId: string, userId: string): Promise<void>;
  archiveForUser(newsId: string, userId: string): Promise<void>;
  unarchiveForUser(newsId: string, userId: string): Promise<void>;
  dismissForUser(newsId: string, userId: string): Promise<void>;
}
