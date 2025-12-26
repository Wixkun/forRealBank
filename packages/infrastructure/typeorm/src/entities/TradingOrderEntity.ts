import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { BrokerageAccountEntity } from './BrokerageAccountEntity';
import { MarketAssetEntity } from './MarketAssetEntity';

@Entity('trading_orders')
@Index(['brokerageAccountId'])
@Index(['status'])
export class TradingOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
