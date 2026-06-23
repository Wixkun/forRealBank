import { INewsRepository, IUserRepository, INotificationRepository, NotificationType, RoleName, User, NewsStatus } from '@forreal/domain';

const ALLOWED_NEWS_AUTHOR_ROLES = [RoleName.ADVISOR, RoleName.DIRECTOR];

export class CreateNewsUseCase {
  constructor(
    private readonly newsRepository: INewsRepository,
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(input: {
    authorId: string;
    title: string;
    content: string;
    status?: NewsStatus;
    userId?: string | null;
  }) {
    const author = await this.userRepository.findById(input.authorId);
    if (!author) throw new Error('AUTHOR_NOT_FOUND');

    // System news (userId set) skips role check — created programmatically
    const isSystemNews = input.userId !== undefined && input.userId !== null;

    if (!isSystemNews) {
      const authorRoles = Array.from(author.roles);
      const canCreateNews = authorRoles.some((role) => ALLOWED_NEWS_AUTHOR_ROLES.includes(role));
      if (!canCreateNews) {
        throw new Error('FORBIDDEN_ONLY_ADVISOR_OR_DIRECTOR_CAN_CREATE_NEWS');
      }
    }

    const news = await this.newsRepository.create({
      authorId: input.authorId,
      title: input.title,
      content: input.content,
      status: input.status ?? NewsStatus.INFORMATION,
      userId: input.userId ?? null,
    });

    // Only notify all users for global news (no specific userId)
    if (!isSystemNews) {
      const allUsers = await this.userRepository.list();
      const notificationPromises = allUsers
        .filter((user: User) => user.id !== input.authorId)
        .map((user: User) =>
          this.notificationRepository.create(
            user.id,
            'Nouvelle actualité',
            input.title,
            NotificationType.NEWS_POSTED,
          ),
        );
      await Promise.all(notificationPromises);
    }

    return {
      newsId: news.id,
      title: news.title,
      content: news.content,
      status: news.status,
      createdAt: news.createdAt,
    };
  }
}
