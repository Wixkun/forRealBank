import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketController } from './market.controller';
import { MarketAssetEntity } from '@forreal/infrastructure-typeorm/entities/MarketAssetEntity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketAssetEntity]),
  ],
  controllers: [MarketController],
})
export class MarketModule {}
