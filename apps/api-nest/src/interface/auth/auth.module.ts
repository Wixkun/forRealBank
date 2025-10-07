import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

import { RegisterUserUseCase } from '../../application/user/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../application/user/usecases/LoginUserUseCase';

import { IUserRepository } from '../../domain/user/ports/IUserRepository';
import { IPasswordHasher } from '../../domain/user/ports/IPasswordHasher';
import { ITokenService } from '../../domain/user/ports/ITokenService';

import { UserEntity } from '../../infrastructure/typeorm/entities/userEntity';
import { UserRepository } from '../../infrastructure/typeorm/repositories/UserRepository';
import { BcryptHasher } from '../../infrastructure/crypto/BcryptHasher';
import { JwtTokenService } from '../../infrastructure/jwt/JwtTokenService';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    JwtStrategy,
    JwtAuthGuard,
    { provide: IUserRepository, useClass: UserRepository },
    { provide: IPasswordHasher, useClass: BcryptHasher },
    { provide: ITokenService, useClass: JwtTokenService },
  ],
  exports: [],
})
export class AuthModule {}
