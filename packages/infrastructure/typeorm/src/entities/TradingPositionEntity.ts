import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BrokerageAccountEntity } from './BrokerageAccountEntity';
import { MarketAssetEntity } from './MarketAssetEntity';
import { BaseEntity } from './BaseEntity';

@Entity('trading_positions')
@Index(['brokerageAccountId'])
@Unique(['brokerageAccountId', 'assetId'])
export class TradingPositionEntity extends BaseEntity {
  @Column({ name: 'brokerage_account_id', type: 'uuid' })
  brokerageAccountId!: string;

  @ManyToOne(() => BrokerageAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brokerage_account_id' })
  brokerageAccount!: BrokerageAccountEntity;

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
