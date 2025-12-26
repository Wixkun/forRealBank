import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsEntity } from '@forreal/infrastructure-typeorm/entities/NewsEntity';
import { UserEntity } from '@forreal/infrastructure-typeorm/entities/UserEntity';

import { INewsRepository } from '@forreal/domain/feed/ports/INewsRepository';
import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';

import { NewsRepository } from '@forreal/infrastructure-typeorm/repositories/NewsRepository';
import { UserRepository } from '@forreal/infrastructure-typeorm/repositories/UserRepository';
import { RoleEntity } from '@forreal/infrastructure-typeorm/entities/RoleEntity';

import { CreateNewsUseCase } from '@forreal/application/feed/usecases/CreateNewsUseCase';
import { ListNewsUseCase } from '@forreal/application/feed/usecases/ListNewsUseCase';
import { DeleteNewsUseCase } from '@forreal/application/feed/usecases/DeleteNewsUseCase';

@Module({
  imports: [TypeOrmModule.forFeature([NewsEntity, UserEntity, RoleEntity])],
  providers: [
    NewsService,
      NewsController,
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
