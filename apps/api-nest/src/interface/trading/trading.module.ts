import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradingController } from './trading.controller';
import { TradingPositionEntity } from '@forreal/infrastructure-typeorm';
import { TradingOrderEntity } from '@forreal/infrastructure-typeorm';
import { BrokerageAccountEntity } from '@forreal/infrastructure-typeorm';
import { MarketAssetEntity } from '@forreal/infrastructure-typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TradingPositionEntity,
      TradingOrderEntity,
      BrokerageAccountEntity,
      MarketAssetEntity,
    ]),
  ],
  controllers: [TradingController],
})
export class TradingModule {}
