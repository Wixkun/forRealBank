export type CardType = 'virtual' | 'physical';
export type CardStatus = 'active' | 'frozen' | 'cancelled';

export interface Card {
  id: string;
  accountId: string;
  type: CardType;
  lastFour: string;
  expiryDate: Date;
  status: CardStatus;
  onlinePaymentsEnabled: boolean;
  contactlessEnabled: boolean;
  internationalPaymentsEnabled: boolean;
  spendingLimit: number;
  withdrawalLimit: number;
  createdAt: Date;
}
