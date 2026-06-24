export type AccountStatus = 'active' | 'closed' | 'suspended';
export type AccountType = 'checking' | 'savings';

export interface Account {
  id: string;
  userId: string;
  name: string;
  accountType: AccountType;
  balance: number;
  iban: string;
  accountNumber: string;
  interestRate: number | null;
  status: AccountStatus;
  openedAt: Date;
}
