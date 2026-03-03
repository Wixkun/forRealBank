import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';

import { IUserRepository } from '@forreal/domain';
import { IPasswordHasher } from '@forreal/domain';
import { ITokenService } from '@forreal/domain';

import { UserEntity } from '@forreal/infrastructure-typeorm';
import { UserRepository } from '@forreal/infrastructure-typeorm';
import { BcryptHasher } from '@forreal/infrastructure-crypto-bcrypt';
import { JwtTokenService } from '@forreal/infrastructure-jwt-nest';
import { RoleEntity } from '@forreal/infrastructure-typeorm';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { NewsModule } from './feed/news.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { MarketModule } from './market/market.module';
import { TradingModule } from './trading/trading.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../env/api.dev.env', '../../env/api.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      synchronize: false,
      logging: false,
      migrationsRun: false,
      entities: [UserEntity, RoleEntity],
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([UserEntity, RoleEntity]),
    AuthModule,
    UsersModule,
    ChatModule,
    NewsModule,
    NotificationsModule,
    AccountsModule,
    TransactionsModule,
    MarketModule,
    TradingModule,
  ],
  providers: [
    { provide: IUserRepository, useClass: UserRepository },
    { provide: IPasswordHasher, useClass: BcryptHasher },
    { provide: ITokenService, useClass: JwtTokenService },
  ],
  exports: [IUserRepository, IPasswordHasher, ITokenService],
})
export class AppModule {}
