export type InvestmentAccountStatus = 'active' | 'closed' | 'suspended';

export interface InvestmentAccount {
  id: string;
  userId: string;
  name: string;
  cashBalance: number;
  totalValue: number;
  totalGainLoss: number;
  status: InvestmentAccountStatus;
  openedAt: Date;
}
