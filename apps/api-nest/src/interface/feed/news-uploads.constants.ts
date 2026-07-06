import { mkdirSync } from 'fs';
import { join } from 'path';

export const NEWS_UPLOADS_DIR = join(process.cwd(), 'uploads', 'news');

mkdirSync(NEWS_UPLOADS_DIR, { recursive: true });

export function buildNewsImageUrl(filename: string): string {
  return `/api/uploads/news/${filename}`;
}
