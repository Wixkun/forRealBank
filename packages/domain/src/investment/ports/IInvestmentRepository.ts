import { InvestmentAccount } from '../InvestmentAccount';

export interface CashMovementData {
  investmentAccountId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  cashBalanceAfter: number;
  description?: string;
}

export interface IInvestmentRepository {
  findById(id: string): Promise<InvestmentAccount | null>;
  listByUser(userId: string): Promise<InvestmentAccount[]>;
  updateCashBalance(id: string, newBalance: number): Promise<void>;
  createCashMovement(data: CashMovementData): Promise<void>;
}
