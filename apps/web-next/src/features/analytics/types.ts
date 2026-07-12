export type MonthlyFlow = { month: string; income: number; outgoing: number };

export type ClientAnalytics = {
  kind: 'client';
  periodMonths: number;
  summary: {
    bankBalance: number;
    investmentValue: number;
    income: number;
    outgoing: number;
    payments: number;
    transfers: number;
    savingsRate: number;
  };
  monthly: MonthlyFlow[];
  categories: Array<{ name: string; amount: number }>;
  largestExpenses: Array<{ id: string; description: string; amount: number; date: string }>;
};

export type StaffAnalytics = {
  kind: 'staff';
  scope: 'advisor' | 'director';
  periodMonths: number;
  summary: {
    clientCount: number;
    bankAssets: number;
    investmentAssets: number;
    transactionVolume: number;
    outgoing: number;
    transactionCount: number;
    attentionCount: number;
  };
  monthly: MonthlyFlow[];
  clients: Array<{
    id: string;
    name: string;
    email: string;
    bankBalance: number;
    investmentValue: number;
    totalAssets: number;
    isBanned: boolean;
    lastLoginAt: string | null;
    lastTransactionAt: string | null;
    needsAttention: boolean;
  }>;
  advisorWorkload: Array<{ id: string; name: string; clientCount: number }>;
};

export type AnalyticsOverview = ClientAnalytics | StaffAnalytics;
