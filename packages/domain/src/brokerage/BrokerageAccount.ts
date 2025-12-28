export type BrokerageAccountStatus = 'active' | 'closed' | 'suspended';

export interface BrokerageAccount {
  id: string;
  userId: string;
  name: string;
  balance: number;
  totalValue: number;
  totalGainLoss: number;
  status: BrokerageAccountStatus;
  openedAt: Date;
}
