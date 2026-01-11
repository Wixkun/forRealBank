import { Repository } from 'typeorm';
import { IBrokerageRepository } from '@forreal/domain';
import { BrokerageAccount } from '@forreal/domain';
import { BrokerageAccountEntity } from '../entities/BrokerageAccountEntity';

export class BrokerageAccountRepository implements IBrokerageRepository {
  constructor(private readonly repo: Repository<BrokerageAccountEntity>) {}

  async findById(id: string): Promise<BrokerageAccount | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.map(e) : null;
  }

  async listByUser(userId: string): Promise<BrokerageAccount[]> {
    const list = await this.repo.find({ where: { userId } });
    return list.map(this.map);
  }

  async updateCashBalance(id: string, newBalance: number): Promise<void> {
    await this.repo.update({ id }, { balance: newBalance });
  }

  private map(e: BrokerageAccountEntity): BrokerageAccount {
    return {
      id: e.id,
      userId: e.userId,
      name: e.name,
      balance: Number(e.balance),
      totalValue: Number(e.totalValue),
      totalGainLoss: Number(e.totalGainLoss),
      status: e.status,
      openedAt: e.openedAt,
    };
  }
}
