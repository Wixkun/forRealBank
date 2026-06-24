import { Repository } from 'typeorm';
import { ICardRepository, Card, CardType, CardStatus } from '@forreal/domain';
import { CardEntity } from '../entities/CardEntity';

export class CardRepository implements ICardRepository {
  constructor(private readonly repo: Repository<CardEntity>) {}

  async findById(id: string): Promise<Card | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.map(e) : null;
  }

  async findByAccountId(accountId: string): Promise<Card[]> {
    const list = await this.repo.find({ where: { accountId } });
    return list.map(this.map);
  }

  async create(params: {
    accountId: string;
    type: CardType;
    lastFour: string;
    expiryDate: Date;
  }): Promise<Card> {
    const entity = this.repo.create(params);
    const saved = await this.repo.save(entity);
    return this.map(saved);
  }

  async updateStatus(id: string, status: CardStatus): Promise<void> {
    await this.repo.update({ id }, { status });
  }

  private map(e: CardEntity): Card {
    return {
      id: e.id,
      accountId: e.accountId,
      type: e.type,
      lastFour: e.lastFour,
      expiryDate: e.expiryDate,
      status: e.status,
      createdAt: e.createdAt,
    };
  }
}
