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
  IEmailVerificationTokenRepository,
  ITokenService,
  IEmailService,
  IUserIdGenerator,
  ISessionIdGenerator,
  ITwoFactorVerifier,
  USER_ID_GENERATOR,
  SESSION_ID_GENERATOR,
} from '@forreal/domain';

import {
  PasswordResetTokenEntity,
  EmailVerificationTokenEntity,
  PasswordResetTokenRepository,
  EmailVerificationTokenRepository,
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
  VerifyEmailUseCase,
} from '@forreal/application';
import { SmtpEmailService } from './smtp-email.service';
import { AuthSchemaBootstrapService } from './auth-schema-bootstrap.service';
import { TwoFactorService } from './two-factor.service';

const registerUserProvider: Provider = {
  provide: RegisterUserUseCase,
  useFactory: (
    users: IUserRepository,
    hasher: IPasswordHasher,
    userIdGenerator: IUserIdGenerator,
    verificationTokens: IEmailVerificationTokenRepository,
    email: IEmailService,
  ) => new RegisterUserUseCase(users, hasher, userIdGenerator, verificationTokens, email),
  inject: [
    IUserRepository,
    IPasswordHasher,
    USER_ID_GENERATOR,
    IEmailVerificationTokenRepository,
    IEmailService,
  ],
};

const loginUserProvider: Provider = {
  provide: LoginUserUseCase,
  useFactory: (
    users: IUserRepository,
    hasher: IPasswordHasher,
    tokens: ITokenService,
    sessionIdGenerator: ISessionIdGenerator,
    twoFactorVerifier: ITwoFactorVerifier,
  ) => new LoginUserUseCase(users, hasher, tokens, sessionIdGenerator, twoFactorVerifier),
  inject: [
    IUserRepository,
    IPasswordHasher,
    ITokenService,
    SESSION_ID_GENERATOR,
    ITwoFactorVerifier,
  ],
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

const verifyEmailProvider: Provider = {
  provide: VerifyEmailUseCase,
  useFactory: (users: IUserRepository, verificationTokens: IEmailVerificationTokenRepository) =>
    new VerifyEmailUseCase(users, verificationTokens),
  inject: [IUserRepository, IEmailVerificationTokenRepository],
};

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      PasswordResetTokenEntity,
      EmailVerificationTokenEntity,
    ]),
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
    { provide: IEmailVerificationTokenRepository, useClass: EmailVerificationTokenRepository },

    { provide: IPasswordHasher, useClass: BcryptHasher },
    { provide: ITokenService, useClass: JwtTokenService },
    { provide: IEmailService, useClass: SmtpEmailService },
    TwoFactorService,
    { provide: ITwoFactorVerifier, useExisting: TwoFactorService },

    { provide: USER_ID_GENERATOR, useClass: UserUuidGenerator },
    { provide: SESSION_ID_GENERATOR, useClass: SessionUuidGenerator },

    JwtStrategy,
    JwtAuthGuard,

    registerUserProvider,
    loginUserProvider,
    requestPasswordResetProvider,
    resetPasswordProvider,
    verifyEmailProvider,
    AuthSchemaBootstrapService,
  ],
  exports: [ITokenService, JwtAuthGuard],
})
export class AuthModule {}
