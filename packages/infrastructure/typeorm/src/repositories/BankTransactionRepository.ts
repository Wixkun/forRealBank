import { Repository } from 'typeorm';
import { ITransactionRepository } from '@forreal/domain/transactions/ports/ITransactionRepository';
import { TransactionType } from '@forreal/domain/transactions/ports/ITransactionRepository';
import { BankTransactionEntity } from '../entities/BankTransactionEntity';

export class BankTransactionRepository implements ITransactionRepository {
  constructor(private readonly repo: Repository<BankTransactionEntity>) {}

  async createBankTransaction(params: {
    accountId: string;
    type: TransactionType;
    description: string;
    amount: number;
    balanceAfter: number;
  }): Promise<void> {
    const entity = this.repo.create({
      accountId: params.accountId,
      type: params.type,
      description: params.description,
      amount: params.amount,
      balanceAfter: params.balanceAfter,
    });
    await this.repo.save(entity);
  }
}
