import { Controller, Get, Query, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketAssetEntity } from '@forreal/infrastructure-typeorm/entities/MarketAssetEntity';

@Controller('market')
export class MarketController {
  constructor(
    @InjectRepository(MarketAssetEntity)
    private readonly assetRepo: Repository<MarketAssetEntity>,
  ) {}

  @Get('assets')
  async getAssets(@Query('type') type?: string) {
    const queryBuilder = this.assetRepo
      .createQueryBuilder('asset')
      .where('asset.is_tradable = :tradable', { tradable: true })
      .orderBy('asset.symbol', 'ASC');

    if (type && type !== 'all') {
      queryBuilder.andWhere('asset.asset_type = :type', { type });
    }

    const assets = await queryBuilder.getMany();

    return assets.map(asset => ({
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      assetType: asset.assetType,
    }));
  }

  @Get('assets/:symbol')
  async getAssetBySymbol(@Param('symbol') symbol: string) {
    const asset = await this.assetRepo.findOne({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    return {
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      assetType: asset.assetType,
      isTradable: asset.isTradable,
    };
  }
}
