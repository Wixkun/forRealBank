import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { InvestmentAccountEntity } from './InvestmentAccountEntity';
import { MarketAssetEntity } from './MarketAssetEntity';
import { BaseEntity } from './BaseEntity';

@Entity('trading_orders')
@Index(['investmentAccountId'])
@Index(['status'])
export class TradingOrderEntity extends BaseEntity {
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

  @Column({ name: 'order_type', type: 'varchar', length: 20 })
  orderType!: 'market' | 'limit' | 'stop';

  @Column({ type: 'varchar', length: 10 })
  side!: 'buy' | 'sell';

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  price?: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: 'pending' | 'executed' | 'cancelled' | 'failed';

  @Column({ name: 'executed_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  executedPrice?: number;

  @Column({ name: 'executed_at', type: 'timestamptz', nullable: true })
  executedAt?: Date;
}
