import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsEntity } from '@forreal/infrastructure-typeorm';
import { UserEntity } from '@forreal/infrastructure-typeorm';

import { INewsRepository } from '@forreal/domain';
import { IUserRepository } from '@forreal/domain';

import { NewsRepository } from '@forreal/infrastructure-typeorm';
import { UserRepository } from '@forreal/infrastructure-typeorm';
import { RoleEntity } from '@forreal/infrastructure-typeorm';

import { CreateNewsUseCase } from '@forreal/application';
import { ListNewsUseCase } from '@forreal/application';
import { DeleteNewsUseCase } from '@forreal/application';

@Module({
  imports: [TypeOrmModule.forFeature([NewsEntity, UserEntity, RoleEntity])],
  controllers: [NewsController],
  providers: [
    NewsService,
    { provide: INewsRepository, useClass: NewsRepository },
    { provide: IUserRepository, useClass: UserRepository },
    {
      provide: CreateNewsUseCase,
      useFactory: (newsRepo, userRepo) => new CreateNewsUseCase(newsRepo, userRepo),
      inject: [INewsRepository, IUserRepository],
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
  ],
  exports: [NewsService],
})
export class NewsModule {}
