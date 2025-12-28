export type TransactionType = 'credit' | 'debit' | 'transfer' | 'payment';

export interface ITransactionRepository {
  createBankTransaction(params: {
    accountId: string;
    type: TransactionType;
    description: string;
    amount: number;
    balanceAfter: number;
  }): Promise<void>;
}
