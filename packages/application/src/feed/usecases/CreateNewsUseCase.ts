import { INewsRepository } from '@forreal/domain/feed/ports/INewsRepository';
import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { RoleName } from '@forreal/domain/user/RoleName';

const ALLOWED_NEWS_AUTHOR_ROLES = [RoleName.ADVISOR, RoleName.DIRECTOR];

export class CreateNewsUseCase {
  constructor(
    private readonly newsRepository: INewsRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: { authorId: string; title: string; content: string }) {
    const author = await this.userRepository.findById(input.authorId);
    if (!author) throw new Error('AUTHOR_NOT_FOUND');

    const authorRoles = Array.from(author.roles);
    const canCreateNews = authorRoles.some(role => ALLOWED_NEWS_AUTHOR_ROLES.includes(role));
    if (!canCreateNews) {
      throw new Error('FORBIDDEN_ONLY_ADVISOR_OR_DIRECTOR_CAN_CREATE_NEWS');
    }

    const news = await this.newsRepository.create(input.authorId, input.title, input.content);
    return { newsId: news.id, title: news.title, content: news.content, createdAt: news.createdAt };
  }
}
