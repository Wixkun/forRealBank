import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
  IUserIdGenerator,
  ISessionIdGenerator,
  USER_ID_GENERATOR,
  SESSION_ID_GENERATOR,
} from '@forreal/domain';

import { UserEntity, RoleEntity, UserRepository } from '@forreal/infrastructure-typeorm';

import { BcryptHasher } from '@forreal/infrastructure-crypto-bcrypt';
import { JwtTokenService } from '@forreal/infrastructure-jwt-nest';
import { UserUuidGenerator, SessionUuidGenerator } from '@forreal/infrastructure-uuid-node';

import { RegisterUserUseCase, LoginUserUseCase } from '@forreal/application';

const registerUserProvider: Provider = {
  provide: RegisterUserUseCase,
  useFactory: (
    users: IUserRepository,
    hasher: IPasswordHasher,
    userIdGenerator: IUserIdGenerator,
  ) => new RegisterUserUseCase(users, hasher, userIdGenerator),
  inject: [IUserRepository, IPasswordHasher, USER_ID_GENERATOR],
};

const loginUserProvider: Provider = {
  provide: LoginUserUseCase,
  useFactory: (
    users: IUserRepository,
    hasher: IPasswordHasher,
    tokens: ITokenService,
    sessionIdGenerator: ISessionIdGenerator,
  ) => new LoginUserUseCase(users, hasher, tokens, sessionIdGenerator),
  inject: [IUserRepository, IPasswordHasher, ITokenService, SESSION_ID_GENERATOR],
};

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RoleEntity]),
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: IUserRepository, useClass: UserRepository },

    { provide: IPasswordHasher, useClass: BcryptHasher },
    { provide: ITokenService, useClass: JwtTokenService },

    { provide: USER_ID_GENERATOR, useClass: UserUuidGenerator },
    { provide: SESSION_ID_GENERATOR, useClass: SessionUuidGenerator },

    JwtStrategy,
    JwtAuthGuard,

    registerUserProvider,
    loginUserProvider,
  ],
  exports: [ITokenService, JwtAuthGuard],
})
export class AuthModule {}
