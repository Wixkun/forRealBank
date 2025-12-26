import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { BankAccountEntity } from './BankAccountEntity';

@Entity('bank_transactions')
@Index(['accountId'])
@Index(['createdAt'])
export class BankTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => BankAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: BankAccountEntity;

  @Column({ type: 'varchar', length: 20 })
  type!: 'credit' | 'debit' | 'transfer' | 'payment';

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 15, scale: 2 })
  balanceAfter!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
