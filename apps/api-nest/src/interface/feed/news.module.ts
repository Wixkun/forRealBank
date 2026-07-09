import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsFilesService } from './news-files.service';
import {
  NewsEntity,
  NewsFileEntity,
  UserNewsStatusEntity,
  UserEntity,
  NotificationEntity,
  RoleEntity,
} from '@forreal/infrastructure-typeorm';
import { INewsRepository, IUserRepository, INotificationRepository } from '@forreal/domain';
import {
  NewsRepository,
  UserRepository,
  NotificationRepository,
} from '@forreal/infrastructure-typeorm';
import {
  CreateNewsUseCase,
  ListNewsUseCase,
  DeleteNewsUseCase,
  UpdateNewsUseCase,
  SetNewsUserStatusUseCase,
} from '@forreal/application';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../auth/roles.guard';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { NewsSeed } from './news.seed';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      NewsEntity,
      NewsFileEntity,
      UserNewsStatusEntity,
      UserEntity,
      RoleEntity,
      NotificationEntity,
    ]),
  ],
  controllers: [NewsController],
  providers: [
    NewsService,
    NewsFilesService,
    RolesGuard,
    OptionalJwtGuard,
    { provide: INewsRepository, useClass: NewsRepository },
    { provide: IUserRepository, useClass: UserRepository },
    { provide: INotificationRepository, useClass: NotificationRepository },
    {
      provide: CreateNewsUseCase,
      useFactory: (newsRepo, userRepo, notifRepo) =>
        new CreateNewsUseCase(newsRepo, userRepo, notifRepo),
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
      provide: SetNewsUserStatusUseCase,
      useFactory: (repo) => new SetNewsUserStatusUseCase(repo),
      inject: [INewsRepository],
    },
    NewsSeed,
  ],
  exports: [NewsService, INewsRepository],
})
export class NewsModule {}
