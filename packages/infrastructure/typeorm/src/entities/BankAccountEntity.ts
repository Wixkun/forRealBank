import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserEntity } from './UserEntity';
import { BaseEntity } from './BaseEntity';

@Entity('bank_accounts')
@Index(['userId'])
export class BankAccountEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'account_type', type: 'varchar', length: 20 })
  accountType!: 'checking' | 'savings';

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance!: number;

  @Column({ type: 'varchar', length: 34, unique: true })
  iban!: string;

  @Column({ name: 'account_number', type: 'varchar', length: 20 })
  accountNumber!: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: 'active' | 'closed' | 'suspended';

  @Column({ name: 'opened_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  openedAt!: Date;
}
