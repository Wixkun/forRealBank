import { Card, CardType, CardStatus } from '../Card';

export interface ICardRepository {
  findById(id: string): Promise<Card | null>;
  findByAccountId(accountId: string): Promise<Card[]>;
  create(params: { accountId: string; type: CardType; lastFour: string; expiryDate: Date }): Promise<Card>;
  updateStatus(id: string, status: CardStatus): Promise<void>;
}
