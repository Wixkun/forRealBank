import { Account } from '../Account';

export interface IAccountRepository {
  findById(id: string): Promise<Account | null>;
  findByIban(iban: string): Promise<Account | null>;
  listByUser(userId: string): Promise<Account[]>;
  updateBalance(id: string, newBalance: number): Promise<void>;
}
