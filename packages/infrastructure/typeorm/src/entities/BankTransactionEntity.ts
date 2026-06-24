import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AccountEntity } from './AccountEntity';
import { ImmutableEntity } from './ImmutableEntity';

@Entity('bank_transactions')
@Index(['accountId'])
@Index(['createdAt'])
export class BankTransactionEntity extends ImmutableEntity {
  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;

  @Column({ type: 'varchar', length: 20 })
  type!: 'credit' | 'debit' | 'transfer' | 'payment';

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 15, scale: 2 })
  balanceAfter!: number;
}
