export type BankAccountStatus = 'active' | 'closed' | 'suspended';
export type BankAccountType = 'checking' | 'savings';

export interface BankAccount {
  id: string;
  userId: string;
  name: string;
  accountType: BankAccountType;
  balance: number;
  iban: string;
  accountNumber: string;
  status: BankAccountStatus;
  openedAt: Date;
}
