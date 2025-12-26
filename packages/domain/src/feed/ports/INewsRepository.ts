import { News } from '../News';

export const INewsRepository = Symbol('INewsRepository');

export interface INewsRepository {
  findById(id: string): Promise<News | null>;
  save(news: News): Promise<void>;
  create(authorId: string | null, title: string, content: string): Promise<News>;
  list(params?: { limit?: number; offset?: number }): Promise<News[]>;
  deleteById(id: string): Promise<void>;
}
