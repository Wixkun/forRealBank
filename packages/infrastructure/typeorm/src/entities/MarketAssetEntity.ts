import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('market_assets')
@Index(['symbol'])
@Index(['assetType'])
export class MarketAssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  symbol!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'asset_type', type: 'varchar', length: 20 })
  assetType!: 'stock' | 'crypto' | 'etf' | 'commodity';

  @Column({ name: 'is_tradable', type: 'boolean', default: true })
  isTradable!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
