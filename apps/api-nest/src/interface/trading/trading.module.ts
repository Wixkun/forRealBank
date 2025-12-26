import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradingController } from './trading.controller';
import { TradingPositionEntity } from '@forreal/infrastructure-typeorm/entities/TradingPositionEntity';
import { TradingOrderEntity } from '@forreal/infrastructure-typeorm/entities/TradingOrderEntity';
import { BrokerageAccountEntity } from '@forreal/infrastructure-typeorm/entities/BrokerageAccountEntity';
import { MarketAssetEntity } from '@forreal/infrastructure-typeorm/entities/MarketAssetEntity';

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
