import { Account, AccountType } from '../Account';

export interface IAccountRepository {
  findById(id: string): Promise<Account | null>;
  findByIban(iban: string): Promise<Account | null>;
  listByUser(userId: string): Promise<Account[]>;
  updateBalance(id: string, newBalance: number): Promise<void>;

  /** Ouvre un compte bancaire (solde 0, statut actif). */
  create(params: {
    userId: string;
    name: string;
    accountType: AccountType;
    iban: string;
    accountNumber: string;
    interestRate?: number | null;
  }): Promise<Account>;
}
