import { Repository } from 'typeorm';
import { IAccountRepository } from '@forreal/domain';
import { BankAccount } from '@forreal/domain';
import { BankAccountEntity } from '../entities/BankAccountEntity';

export class BankAccountRepository implements IAccountRepository {
  constructor(private readonly repo: Repository<BankAccountEntity>) {}

  async findBankAccountById(id: string): Promise<BankAccount | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.map(e) : null;
  }

  async findBankAccountByIban(iban: string): Promise<BankAccount | null> {
    const e = await this.repo.findOne({ where: { iban } });
    return e ? this.map(e) : null;
  }

  async listUserBankAccounts(userId: string): Promise<BankAccount[]> {
    const list = await this.repo.find({ where: { userId } });
    return list.map(this.map);
  }

  async updateBankAccountBalance(id: string, newBalance: number): Promise<void> {
    await this.repo.update({ id }, { balance: newBalance });
  }

  private map(e: BankAccountEntity): BankAccount {
    return {
      id: e.id,
      userId: e.userId,
      name: e.name,
      accountType: e.accountType,
      balance: Number(e.balance),
      iban: e.iban,
      accountNumber: e.accountNumber,
      status: e.status,
      openedAt: e.openedAt,
    };
  }
}
