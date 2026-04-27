import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { MetricsModule } from '../metrics/metrics.module';
import { MonitoringMiddleware } from '../metrics/monitoring.middleware';

import { IUserRepository } from '@forreal/domain';
import { IPasswordHasher } from '@forreal/domain';
import { ITokenService } from '@forreal/domain';

import { UserEntity } from '@forreal/infrastructure-typeorm';
import { UserRepository } from '@forreal/infrastructure-typeorm';
import { BcryptHasher } from '@forreal/infrastructure-crypto-bcrypt';
import { JwtTokenService, resolveEnvSecret } from '@forreal/infrastructure-jwt-nest';
import { RoleEntity } from '@forreal/infrastructure-typeorm';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { NewsModule } from './feed/news.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { MarketModule } from './market/market.module';
import { TradingModule } from './trading/trading.module';

function resolveDatabaseOptions() {
  const databaseUrlRaw = process.env.DATABASE_URL?.trim();
  let parsedDatabaseUrl: URL | undefined;
  if (databaseUrlRaw) {
    try {
      parsedDatabaseUrl = new URL(databaseUrlRaw);
    } catch {
      throw new Error('[AppModule] Invalid DATABASE_URL value');
    }
  }

  const host = process.env.DB_HOST?.trim() || parsedDatabaseUrl?.hostname || 'db';

  const portRaw = process.env.DB_PORT?.trim() || parsedDatabaseUrl?.port || '5432';
  const port = parseInt(portRaw, 10);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`[AppModule] Invalid DB_PORT value: ${JSON.stringify(portRaw)}`);
  }

  const username =
    process.env.DB_USER?.trim() ||
    (parsedDatabaseUrl?.username ? decodeURIComponent(parsedDatabaseUrl.username) : '') ||
    'forreal';

  const passwordFromUrl = parsedDatabaseUrl?.password
    ? decodeURIComponent(parsedDatabaseUrl.password)
    : undefined;
  const password = resolveEnvSecret('DB_PASS') ?? passwordFromUrl ?? 'forreal';

  const databaseFromUrl = parsedDatabaseUrl?.pathname
    ? decodeURIComponent(parsedDatabaseUrl.pathname.replace(/^\/+/, ''))
    : '';
  const database = process.env.DB_NAME?.trim() || databaseFromUrl || 'forrealbank';

  return {
    host,
    port,
    username,
    password,
    database,
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...resolveDatabaseOptions(),
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
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: IUserRepository, useClass: UserRepository },
    { provide: IPasswordHasher, useClass: BcryptHasher },
    { provide: ITokenService, useClass: JwtTokenService },
  ],
  exports: [IUserRepository, IPasswordHasher, ITokenService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MonitoringMiddleware).forRoutes('*');
  }
}
