import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AccountEntity } from './AccountEntity';
import { BaseEntity } from './BaseEntity';

@Entity('cards')
@Index(['accountId'])
export class CardEntity extends BaseEntity {
  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;

  @Column({ type: 'varchar', length: 10 })
  type!: 'virtual' | 'physical';

  @Column({ name: 'last_four', type: 'varchar', length: 4 })
  lastFour!: string;

  @Column({ name: 'expiry_date', type: 'timestamptz' })
  expiryDate!: Date;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: 'active' | 'frozen' | 'cancelled';

  @Column({ name: 'online_payments_enabled', type: 'boolean', default: true })
  onlinePaymentsEnabled!: boolean;

  @Column({ name: 'contactless_enabled', type: 'boolean', default: true })
  contactlessEnabled!: boolean;

  @Column({ name: 'international_payments_enabled', type: 'boolean', default: false })
  internationalPaymentsEnabled!: boolean;

  @Column({ name: 'spending_limit', type: 'decimal', precision: 10, scale: 2, default: 2500 })
  spendingLimit!: number;

  @Column({ name: 'withdrawal_limit', type: 'decimal', precision: 10, scale: 2, default: 500 })
  withdrawalLimit!: number;
}
