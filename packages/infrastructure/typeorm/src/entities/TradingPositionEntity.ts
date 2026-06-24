import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { InvestmentAccountEntity } from './InvestmentAccountEntity';
import { MarketAssetEntity } from './MarketAssetEntity';
import { BaseEntity } from './BaseEntity';

@Entity('trading_positions')
@Index(['investmentAccountId'])
@Unique(['investmentAccountId', 'assetId'])
export class TradingPositionEntity extends BaseEntity {
  @Column({ name: 'investment_account_id', type: 'uuid' })
  investmentAccountId!: string;

  @ManyToOne(() => InvestmentAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'investment_account_id' })
  investmentAccount!: InvestmentAccountEntity;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @ManyToOne(() => MarketAssetEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset!: MarketAssetEntity;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  quantity!: number;

  @Column({ name: 'avg_purchase_price', type: 'decimal', precision: 15, scale: 2 })
  avgPurchasePrice!: number;
}
