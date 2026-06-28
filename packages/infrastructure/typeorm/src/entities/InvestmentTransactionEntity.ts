import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { InvestmentAccountEntity } from './InvestmentAccountEntity';
import { ImmutableEntity } from './ImmutableEntity';

@Entity('investment_transactions')
@Index(['investmentAccountId'])
@Index(['createdAt'])
export class InvestmentTransactionEntity extends ImmutableEntity {
  @Column({ name: 'investment_account_id', type: 'uuid' })
  investmentAccountId!: string;

  @ManyToOne(() => InvestmentAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'investment_account_id' })
  investmentAccount!: InvestmentAccountEntity;

  @Column({ type: 'varchar', length: 20 })
  type!: 'deposit' | 'withdrawal';

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column({ name: 'cash_balance_after', type: 'decimal', precision: 15, scale: 2 })
  cashBalanceAfter!: number;
}
