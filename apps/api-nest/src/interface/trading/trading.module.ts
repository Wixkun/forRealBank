import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradingController } from './trading.controller';
import { TradingPositionEntity } from '@forreal/infrastructure-typeorm';
import { TradingOrderEntity } from '@forreal/infrastructure-typeorm';
import { InvestmentAccountEntity } from '@forreal/infrastructure-typeorm';
import { MarketAssetEntity } from '@forreal/infrastructure-typeorm';
import { InvestmentTransactionEntity } from '@forreal/infrastructure-typeorm';
import { NotBannedGuard } from '../auth/not-banned.guard';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../auth/roles.guard';
import { UsersModule } from '../users/users.module';
import { MarketDataService } from './market-quotes';
import { TradingSchemaBootstrapService } from './trading-schema-bootstrap.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TypeOrmModule.forFeature([
      TradingPositionEntity,
      TradingOrderEntity,
      InvestmentAccountEntity,
      MarketAssetEntity,
      InvestmentTransactionEntity,
    ]),
  ],
  controllers: [TradingController],
  providers: [NotBannedGuard, RolesGuard, MarketDataService, TradingSchemaBootstrapService],
})
export class TradingModule {}
