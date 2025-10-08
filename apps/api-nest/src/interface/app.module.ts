import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';

import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { IPasswordHasher } from '@forreal/domain/user/ports/IPasswordHasher';
import { ITokenService } from '@forreal/domain/user/ports/ITokenService';

import { UserEntity } from '@forreal/infrastructure-typeorm/entities/UserEntity';
import { UserRepository } from '@forreal/infrastructure-typeorm/repositories/UserRepository';
import { BcryptHasher } from '@forreal/infrastructure-crypto-bcrypt/BcryptHasher';
import { JwtTokenService } from '@forreal/infrastructure-jwt-nest/JwtTokenService';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../env/api.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      synchronize: true,
      entities: [UserEntity],
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([UserEntity]),
    AuthModule,
  ],
  providers: [
    { provide: IUserRepository, useClass: UserRepository },
    { provide: IPasswordHasher, useClass: BcryptHasher },
    { provide: ITokenService, useClass: JwtTokenService },
  ],
  exports: [IUserRepository, IPasswordHasher, ITokenService],
})
export class AppModule {}
