import { Repository } from 'typeorm';
import { IAccountRepository, Account } from '@forreal/domain';
import { AccountEntity } from '../entities/AccountEntity';

export class AccountRepository implements IAccountRepository {
  constructor(private readonly repo: Repository<AccountEntity>) {}

  async findById(id: string): Promise<Account | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.map(e) : null;
  }

  async findByIban(iban: string): Promise<Account | null> {
    const e = await this.repo.findOne({ where: { iban } });
    return e ? this.map(e) : null;
  }

  async listByUser(userId: string): Promise<Account[]> {
    const list = await this.repo.find({ where: { userId } });
    return list.map(this.map);
  }

  async updateBalance(id: string, newBalance: number): Promise<void> {
    await this.repo.update({ id }, { balance: newBalance });
  }

  private map(e: AccountEntity): Account {
    return {
      id: e.id,
      userId: e.userId,
      name: e.name,
      accountType: e.accountType,
      balance: Number(e.balance),
      iban: e.iban,
      accountNumber: e.accountNumber,
      interestRate: e.interestRate !== null ? Number(e.interestRate) : null,
      status: e.status,
      openedAt: e.openedAt,
    };
  }
}
