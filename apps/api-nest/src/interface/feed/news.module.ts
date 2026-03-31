import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsEntity } from '@forreal/infrastructure-typeorm';
import { UserEntity } from '@forreal/infrastructure-typeorm';
import { NotificationEntity } from '@forreal/infrastructure-typeorm';

import { INewsRepository } from '@forreal/domain';
import { IUserRepository } from '@forreal/domain';
import { INotificationRepository } from '@forreal/domain';

import { NewsRepository } from '@forreal/infrastructure-typeorm';
import { UserRepository } from '@forreal/infrastructure-typeorm';
import { NotificationRepository } from '@forreal/infrastructure-typeorm';
import { RoleEntity } from '@forreal/infrastructure-typeorm';

import { CreateNewsUseCase, ListNewsUseCase, DeleteNewsUseCase, UpdateNewsUseCase } from '@forreal/application';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([NewsEntity, UserEntity, RoleEntity, NotificationEntity])],
  controllers: [NewsController],
  providers: [
    NewsService,
    RolesGuard,
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
  ],
  exports: [NewsService],
})
export class NewsModule {}
