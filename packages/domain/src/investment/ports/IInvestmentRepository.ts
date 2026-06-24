import { InvestmentAccount } from '../InvestmentAccount';

export interface IInvestmentRepository {
  findById(id: string): Promise<InvestmentAccount | null>;
  listByUser(userId: string): Promise<InvestmentAccount[]>;
  updateCashBalance(id: string, newBalance: number): Promise<void>;
}
