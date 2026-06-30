import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import {
  NewsEntity,
  UserNewsStatusEntity,
  UserEntity,
  NotificationEntity,
  RoleEntity,
} from '@forreal/infrastructure-typeorm';
import { INewsRepository, IUserRepository, INotificationRepository } from '@forreal/domain';
import { NewsRepository, UserRepository, NotificationRepository } from '@forreal/infrastructure-typeorm';
import {
  CreateNewsUseCase,
  ListNewsUseCase,
  DeleteNewsUseCase,
  UpdateNewsUseCase,
  ArchiveNewsUseCase,
  UnarchiveNewsUseCase,
  DismissNewsUseCase,
  MarkAsReadUseCase,
} from '@forreal/application';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../auth/roles.guard';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { NewsSeed } from './news.seed';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([NewsEntity, UserNewsStatusEntity, UserEntity, RoleEntity, NotificationEntity]),
  ],
  controllers: [NewsController],
  providers: [
    NewsService,
    RolesGuard,
    OptionalJwtGuard,
    { provide: INewsRepository, useClass: NewsRepository },
    { provide: IUserRepository, useClass: UserRepository },
    { provide: INotificationRepository, useClass: NotificationRepository },
    {
      provide: CreateNewsUseCase,
      useFactory: (newsRepo, userRepo, notifRepo) => new CreateNewsUseCase(newsRepo, userRepo, notifRepo),
      inject: [INewsRepository, IUserRepository, INotificationRepository],
    },
    {
      provide: ListNewsUseCase,
      useFactory: (repo) => new ListNewsUseCase(repo),
      inject: [INewsRepository],
    },
    {
      provide: DeleteNewsUseCase,
      useFactory: (repo) => new DeleteNewsUseCase(repo),
      inject: [INewsRepository],
    },
    {
      provide: UpdateNewsUseCase,
      useFactory: (repo) => new UpdateNewsUseCase(repo),
      inject: [INewsRepository],
    },
    {
      provide: ArchiveNewsUseCase,
      useFactory: (repo) => new ArchiveNewsUseCase(repo),
      inject: [INewsRepository],
    },
    {
      provide: UnarchiveNewsUseCase,
      useFactory: (repo) => new UnarchiveNewsUseCase(repo),
      inject: [INewsRepository],
    },
    {
      provide: DismissNewsUseCase,
      useFactory: (repo) => new DismissNewsUseCase(repo),
      inject: [INewsRepository],
    },
    {
      provide: MarkAsReadUseCase,
      useFactory: (repo) => new MarkAsReadUseCase(repo),
      inject: [INewsRepository],
    },
    NewsSeed,
  ],
  exports: [NewsService, INewsRepository],
})
export class NewsModule {}
