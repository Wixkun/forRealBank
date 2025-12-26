import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { BrokerageAccountEntity } from './BrokerageAccountEntity';
import { MarketAssetEntity } from './MarketAssetEntity';

@Entity('trading_positions')
@Index(['brokerageAccountId'])
@Unique(['brokerageAccountId', 'assetId'])
export class TradingPositionEntity {
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

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  quantity!: number;

  @Column({ name: 'avg_purchase_price', type: 'decimal', precision: 15, scale: 2 })
  avgPurchasePrice!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
