export interface DirectoryUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isBanned: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  clientCount?: number;
  advisor?: { id: string; firstName: string; lastName: string } | null;
}

export interface UserDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  isBanned: boolean;
  lastSeenAt: string | null;
  createdAt: string | null;
  advisor?: { id: string; firstName: string; lastName: string } | null;
  hasPendingBanRequest?: boolean;
  clientCount?: number;
  clients?: Array<{ id: string; firstName: string; lastName: string; isBanned: boolean }>;
}

export interface ManagedBankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings';
  balance: number;
  currency: string;
  iban: string;
  accountNumber: string;
  interestRate: number | null;
  status: string;
  openedAt: string | null;
}

export interface ManagedInvestmentAccount {
  id: string;
  name: string;
  type: 'investment';
  cashBalance: number;
  totalValue: number;
  totalGainLoss: number;
  currency: string;
  status: string;
  openedAt: string | null;
}

export interface ClientAccounts {
  accounts: ManagedBankAccount[];
  investmentAccounts: ManagedInvestmentAccount[];
}

// Compte « unifié » manipulé par la vue transactions / relevés.
export type ManagedAccount =
  | (ManagedBankAccount & { kind: 'bank' })
  | (ManagedInvestmentAccount & { kind: 'investment' });

export interface ManagedTransaction {
  id: string;
  date: string;
  description: string;
  type: string;
  amount: number; // signé : crédit > 0, débit < 0
  balance: number;
}

export interface BanRequestCard {
  id: string;
  messageId: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  clientId: string;
  clientName: string;
  advisorName: string;
  reason: string;
  decisionComment: string | null;
  processedAt: string | null;
  createdAt: string | null;
  canDecide: boolean;
}
