import { Repository } from 'typeorm';
import { IInvestmentRepository, InvestmentAccount, CashMovementData } from '@forreal/domain';
import { InvestmentAccountEntity } from '../entities/InvestmentAccountEntity';
import { InvestmentTransactionEntity } from '../entities/InvestmentTransactionEntity';

export class InvestmentAccountRepository implements IInvestmentRepository {
  constructor(
    private readonly repo: Repository<InvestmentAccountEntity>,
    private readonly txnRepo?: Repository<InvestmentTransactionEntity>,
  ) {}

  async findById(id: string): Promise<InvestmentAccount | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.map(e) : null;
  }

  async listByUser(userId: string): Promise<InvestmentAccount[]> {
    const list = await this.repo.find({ where: { userId } });
    return list.map(this.map);
  }

  async updateCashBalance(id: string, newBalance: number): Promise<void> {
    await this.repo.update({ id }, { cashBalance: newBalance });
  }

  async create(params: { userId: string; name: string }): Promise<InvestmentAccount> {
    const entity = this.repo.create({
      userId: params.userId,
      name: params.name,
      cashBalance: 0,
      totalValue: 0,
      totalGainLoss: 0,
      status: 'active',
      openedAt: new Date(),
    });
    const saved = await this.repo.save(entity);
    return this.map(saved);
  }

  async createCashMovement(data: CashMovementData): Promise<void> {
    if (!this.txnRepo) return;
    await this.txnRepo.save(
      this.txnRepo.create({
        investmentAccountId: data.investmentAccountId,
        type: data.type,
        amount: data.amount,
        cashBalanceAfter: data.cashBalanceAfter,
        description: data.description ?? '',
      }),
    );
  }

  private map(e: InvestmentAccountEntity): InvestmentAccount {
    return {
      id: e.id,
      userId: e.userId,
      name: e.name,
      cashBalance: Number(e.cashBalance),
      totalValue: Number(e.totalValue),
      totalGainLoss: Number(e.totalGainLoss),
      status: e.status,
      openedAt: e.openedAt,
    };
  }
}
