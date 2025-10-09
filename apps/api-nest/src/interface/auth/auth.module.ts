import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { IPasswordHasher } from '@forreal/domain/user/ports/IPasswordHasher';
import { ITokenService } from '@forreal/domain/user/ports/ITokenService';

import { UserEntity } from '@forreal/infrastructure-typeorm/entities/UserEntity';
import { RoleEntity } from '@forreal/infrastructure-typeorm/entities/RoleEntity';
import { UserRepository } from '@forreal/infrastructure-typeorm/repositories/UserRepository';
import { BcryptHasher } from '@forreal/infrastructure-crypto-bcrypt/BcryptHasher';
import { JwtTokenService } from '@forreal/infrastructure-jwt-nest/JwtTokenService';

import { RegisterUserUseCase } from '@forreal/application/user/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from '@forreal/application/user/usecases/LoginUserUseCase';

const registerUserProvider: Provider = {
  provide: RegisterUserUseCase,
  useFactory: (users: IUserRepository, hasher: IPasswordHasher) =>
    new RegisterUserUseCase(users, hasher),
  inject: [IUserRepository, IPasswordHasher],
};

const loginUserProvider: Provider = {
  provide: LoginUserUseCase,
  useFactory: (users: IUserRepository, hasher: IPasswordHasher, tokens: ITokenService) =>
    new LoginUserUseCase(users, hasher, tokens),
  inject: [IUserRepository, IPasswordHasher, ITokenService],
};

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RoleEntity]),
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: IUserRepository, useClass: UserRepository },
    { provide: IPasswordHasher, useClass: BcryptHasher },
    { provide: ITokenService, useClass: JwtTokenService },
    JwtStrategy,
    JwtAuthGuard,
    registerUserProvider,
    loginUserProvider,
  ],

  exports: [ITokenService, JwtAuthGuard],
})
export class AuthModule {}
