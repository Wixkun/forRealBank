import { News, NewsStatus } from '../News';

export const INewsRepository = Symbol('INewsRepository');

export interface INewsRepository {
  findById(id: string): Promise<News | null>;
  save(news: News): Promise<void>;
  create(params: {
    authorId: string | null;
    title: string;
    content: string;
    status?: NewsStatus;
    userId?: string | null;
  }): Promise<News>;
  list(params?: {
    limit?: number;
    offset?: number;
    userId?: string | null;
    includeArchived?: boolean;
  }): Promise<News[]>;
  deleteById(id: string): Promise<void>;
  archiveById(id: string): Promise<void>;
  unarchiveById(id: string): Promise<void>;
  dismissForUser(newsId: string, userId: string): Promise<void>;
}
