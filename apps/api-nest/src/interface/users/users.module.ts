import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { UserEntity } from '@forreal/infrastructure-typeorm/entities/UserEntity';
import { UserRepository } from '@forreal/infrastructure-typeorm/repositories/UserRepository';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [{ provide: IUserRepository, useClass: UserRepository }],
  exports:   [{ provide: IUserRepository, useClass: UserRepository }],
})
export class UsersModule {}