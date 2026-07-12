import { Repository } from 'typeorm';
import { IAccountRepository, Account, AccountType } from '@forreal/domain';
import { AccountEntity } from '../entities/AccountEntity';

export class AccountRepository implements IAccountRepository {
  constructor(private readonly repo: Repository<AccountEntity>) {}

  async findById(id: string): Promise<Account | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.map(e) : null;
  }

  async findByIban(iban: string): Promise<Account | null> {
    // Les IBAN sont historiquement stockés AVEC espaces (« FR76 9876 … ») :
    // la comparaison ignore les espaces des deux côtés, sinon un IBAN saisi
    // sans espaces (ou un bénéficiaire enregistré, stocké normalisé) ne
    // matcherait jamais un compte interne.
    const normalized = iban.replace(/\s/g, '');
    const e = await this.repo
      .createQueryBuilder('account')
      .where(`REPLACE(account.iban, ' ', '') = :iban`, { iban: normalized })
      .getOne();
    return e ? this.map(e) : null;
  }

  async listByUser(userId: string): Promise<Account[]> {
    const list = await this.repo.find({ where: { userId } });
    return list.map(this.map);
  }

  async updateBalance(id: string, newBalance: number): Promise<void> {
    await this.repo.update({ id }, { balance: newBalance });
  }

  async create(params: {
    userId: string;
    name: string;
    accountType: AccountType;
    iban: string;
    accountNumber: string;
    interestRate?: number | null;
  }): Promise<Account> {
    const entity = this.repo.create({
      userId: params.userId,
      name: params.name,
      accountType: params.accountType,
      balance: 0,
      iban: params.iban,
      accountNumber: params.accountNumber,
      interestRate: params.interestRate ?? null,
      status: 'active',
      openedAt: new Date(),
    });
    const saved = await this.repo.save(entity);
    return this.map(saved);
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
