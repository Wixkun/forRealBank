import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';

@Entity('market_assets')
@Index(['symbol'])
@Index(['assetType'])
export class MarketAssetEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  symbol!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'asset_type', type: 'varchar', length: 20 })
  assetType!: 'stock' | 'crypto' | 'etf' | 'commodity';

  @Column({ name: 'is_tradable', type: 'boolean', default: false })
  isTradable!: boolean;

  @Column({ name: 'proposed_by_director_id', type: 'uuid', nullable: true })
  proposedByDirectorId!: string | null;

  @Column({ name: 'proposed_at', type: 'timestamptz', nullable: true })
  proposedAt!: Date | null;
}
