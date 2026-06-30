import {
  INewsRepository,
  IUserRepository,
  INotificationRepository,
  NotificationType,
  NotificationTargetType,
  RoleName,
  User,
  NewsStatus,
  NewsSource,
  MANUAL_ALLOWED_TYPES,
} from '@forreal/domain';

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
    source?: NewsSource;
    userId?: string | null;
  }) {
    const author = await this.userRepository.findById(input.authorId);
    if (!author) throw new Error('AUTHOR_NOT_FOUND');

    const isAutomaticNews = input.source === NewsSource.AUTOMATIC;

    if (!isAutomaticNews) {
      const authorRoles = Array.from(author.roles);
      const canCreateNews = authorRoles.some((role) => ALLOWED_NEWS_AUTHOR_ROLES.includes(role));
      if (!canCreateNews) {
        throw new Error('FORBIDDEN_ONLY_ADVISOR_OR_DIRECTOR_CAN_CREATE_NEWS');
      }

      const newsType = input.status ?? NewsStatus.INFORMATION;
      if (!MANUAL_ALLOWED_TYPES.includes(newsType)) {
        throw new Error('FORBIDDEN_MANUAL_NEWS_TYPE_MUST_BE_INFORMATION_OR_SYSTEM');
      }
    }

    const news = await this.newsRepository.create({
      authorId: input.authorId,
      title: input.title,
      content: input.content,
      status: input.status ?? NewsStatus.INFORMATION,
      source: isAutomaticNews ? NewsSource.AUTOMATIC : NewsSource.MANUAL,
      userId: input.userId ?? null,
    });

    if (!isAutomaticNews) {
      const allUsers = await this.userRepository.list();
      const notificationPromises = allUsers
        .filter((user: User) => user.id !== input.authorId)
        .map((user: User) =>
          this.notificationRepository.create({
            userId: user.id,
            title: 'Nouvelle actualité',
            content: input.title,
            type: NotificationType.NEWS,
            targetType: NotificationTargetType.NEWS,
            targetId: news.id,
            targetUrl: `/dashboard/news/${news.id}`,
          }),
        );
      await Promise.all(notificationPromises);
    }

    return {
      newsId: news.id,
      title: news.title,
      content: news.content,
      status: news.status,
      source: news.source,
      createdAt: news.createdAt,
    };
  }
}
