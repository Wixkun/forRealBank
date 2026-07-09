import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { MetricsModule } from '../../metrics/metrics.module';

import {
  IUserRepository,
  IPasswordHasher,
  IPasswordResetTokenRepository,
  ITokenService,
  IEmailService,
  IUserIdGenerator,
  ISessionIdGenerator,
  USER_ID_GENERATOR,
  SESSION_ID_GENERATOR,
} from '@forreal/domain';

import {
  PasswordResetTokenEntity,
  PasswordResetTokenRepository,
  UserEntity,
  RoleEntity,
  UserRepository,
} from '@forreal/infrastructure-typeorm';

import { BcryptHasher } from '@forreal/infrastructure-crypto-bcrypt';
import { JwtTokenService } from '@forreal/infrastructure-jwt-nest';
import { UserUuidGenerator, SessionUuidGenerator } from '@forreal/infrastructure-uuid-node';

import {
  RegisterUserUseCase,
  LoginUserUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
} from '@forreal/application';
import { SmtpEmailService } from './smtp-email.service';

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

const requestPasswordResetProvider: Provider = {
  provide: RequestPasswordResetUseCase,
  useFactory: (
    users: IUserRepository,
    resetTokens: IPasswordResetTokenRepository,
    email: IEmailService,
  ) => new RequestPasswordResetUseCase(users, resetTokens, email),
  inject: [IUserRepository, IPasswordResetTokenRepository, IEmailService],
};

const resetPasswordProvider: Provider = {
  provide: ResetPasswordUseCase,
  useFactory: (
    users: IUserRepository,
    resetTokens: IPasswordResetTokenRepository,
    hasher: IPasswordHasher,
  ) => new ResetPasswordUseCase(users, resetTokens, hasher),
  inject: [IUserRepository, IPasswordResetTokenRepository, IPasswordHasher],
};

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RoleEntity, PasswordResetTokenEntity]),
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    }),
    MetricsModule,
  ],
  controllers: [AuthController],
  providers: [
    { provide: IUserRepository, useClass: UserRepository },
    { provide: IPasswordResetTokenRepository, useClass: PasswordResetTokenRepository },

    { provide: IPasswordHasher, useClass: BcryptHasher },
    { provide: ITokenService, useClass: JwtTokenService },
    { provide: IEmailService, useClass: SmtpEmailService },

    { provide: USER_ID_GENERATOR, useClass: UserUuidGenerator },
    { provide: SESSION_ID_GENERATOR, useClass: SessionUuidGenerator },

    JwtStrategy,
    JwtAuthGuard,

    registerUserProvider,
    loginUserProvider,
    requestPasswordResetProvider,
    resetPasswordProvider,
  ],
  exports: [ITokenService, JwtAuthGuard],
})
export class AuthModule {}
