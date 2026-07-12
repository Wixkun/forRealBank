import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradingController } from './trading.controller';
import { TradingPositionEntity } from '@forreal/infrastructure-typeorm';
import { TradingOrderEntity } from '@forreal/infrastructure-typeorm';
import { InvestmentAccountEntity } from '@forreal/infrastructure-typeorm';
import { MarketAssetEntity } from '@forreal/infrastructure-typeorm';
import { InvestmentTransactionEntity } from '@forreal/infrastructure-typeorm';
import { NotBannedGuard } from '../auth/not-banned.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TradingPositionEntity,
      TradingOrderEntity,
      InvestmentAccountEntity,
      MarketAssetEntity,
      InvestmentTransactionEntity,
    ]),
  ],
  controllers: [TradingController],
  providers: [NotBannedGuard],
})
export class TradingModule {}
