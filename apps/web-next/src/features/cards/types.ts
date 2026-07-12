export type BankCardStatus = 'active' | 'frozen' | 'cancelled';

export type BankCard = {
  id: string;
  accountId: string;
  accountName: string;
  accountIban: string;
  type: 'virtual' | 'physical';
  lastFour: string;
  expiryDate: string;
  status: BankCardStatus;
  onlinePaymentsEnabled: boolean;
  contactlessEnabled: boolean;
  internationalPaymentsEnabled: boolean;
  spendingLimit: number;
  withdrawalLimit: number;
};

export type CardSettings = Pick<
  BankCard,
  | 'onlinePaymentsEnabled'
  | 'contactlessEnabled'
  | 'internationalPaymentsEnabled'
  | 'spendingLimit'
  | 'withdrawalLimit'
>;
