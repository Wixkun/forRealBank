import { BankAccount } from '../BankAccount';

export interface IAccountRepository {
  findBankAccountById(id: string): Promise<BankAccount | null>;
  findBankAccountByIban(iban: string): Promise<BankAccount | null>;
  listUserBankAccounts(userId: string): Promise<BankAccount[]>;
  updateBankAccountBalance(id: string, newBalance: number): Promise<void>;
}
