import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserEntity } from './UserEntity';
import { BaseEntity } from './BaseEntity';

@Entity('investment_accounts')
@Index(['userId'])
export class InvestmentAccountEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'cash_balance', type: 'decimal', precision: 15, scale: 2, default: 0 })
  cashBalance!: number;

  @Column({ name: 'total_value', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue!: number;

  @Column({ name: 'total_gain_loss', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalGainLoss!: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: 'active' | 'closed' | 'suspended';

  @Column({ name: 'opened_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  openedAt!: Date;
}
