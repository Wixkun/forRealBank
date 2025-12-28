import { BrokerageAccount } from '../BrokerageAccount';

export interface IBrokerageRepository {
  findById(id: string): Promise<BrokerageAccount | null>;
  listByUser(userId: string): Promise<BrokerageAccount[]>;
  updateCashBalance(id: string, newBalance: number): Promise<void>;
}
