import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UserEntity } from './UserEntity';

@Entity('brokerage_accounts')
@Index(['userId'])
export class BrokerageAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance!: number;

  @Column({ name: 'total_value', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue!: number;

  @Column({ name: 'total_gain_loss', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalGainLoss!: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: 'active' | 'closed' | 'suspended';

  @Column({ name: 'opened_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  openedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
