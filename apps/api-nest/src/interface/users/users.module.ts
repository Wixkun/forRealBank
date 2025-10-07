// interface/users/users.module.ts (ou un module Infra)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IUserRepository } from '../../domain/user/ports/IUserRepository';
import { UserEntity } from '../../infrastructure/typeorm/entities/userEntity';
import { UserRepository } from '../../infrastructure/typeorm/repositories/UserRepository';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [{ provide: IUserRepository, useClass: UserRepository }],
  exports: [{ provide: IUserRepository, useClass: UserRepository }],
})
export class UsersModule {}
