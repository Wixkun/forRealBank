import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RoleName } from '@forreal/domain';

type RawTransaction = {
  id: string;
  type: string;
  description: string;
  amount: string | number;
  created_at: Date | string;
};
type BalanceRow = { bank_balance: string | number; investment_value: string | number };
type StaffClientRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_banned: boolean;
  last_login_at: Date | string | null;
};
type FinancialRow = {
  id: string;
  bank_balance: string | number;
  investment_value: string | number;
  last_transaction_at: Date | string | null;
};
type StaffTransactionRow = { amount: string | number; type: string; created_at: Date | string };
type AdvisorRow = {
  id: string;
  first_name: string;
  last_name: string;
  client_count: string | number;
};
type ClientDetail = {
  id: string;
  name: string;
  email: string;
  bankBalance: number;
  investmentValue: number;
  totalAssets: number;
  isBanned: boolean;
  lastLoginAt: Date | string | null;
  lastTransactionAt: Date | string | null;
  needsAttention: boolean;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  overview(userId: string, roles: RoleName[], months: number) {
    if (roles.includes(RoleName.ADVISOR)) return this.staffOverview(userId, 'advisor', months);
    if (roles.includes(RoleName.DIRECTOR) || roles.includes(RoleName.ADMIN)) {
      return this.staffOverview(userId, 'director', months);
    }
    return this.clientOverview(userId, months);
  }

  private async clientOverview(userId: string, months: number) {
    const [balances, transactions] = await Promise.all([
      this.dataSource.query<BalanceRow[]>(
        `SELECT
           COALESCE((SELECT SUM(balance) FROM accounts WHERE user_id = $1), 0) AS bank_balance,
           COALESCE((SELECT SUM(total_value) FROM investment_accounts WHERE user_id = $1), 0) AS investment_value`,
        [userId],
      ),
      this.dataSource.query<RawTransaction[]>(
        `SELECT transaction.id, transaction.type, transaction.description,
                transaction.amount, transaction.created_at
         FROM bank_transactions transaction
         JOIN accounts account ON account.id = transaction.account_id
         WHERE account.user_id = $1
           AND transaction.created_at >= date_trunc('month', now()) - (($2::int - 1) * interval '1 month')
         ORDER BY transaction.created_at DESC`,
        [userId, months],
      ),
    ]);

    const monthly = this.emptyMonths(months);
    const categories = new Map<string, number>();
    let income = 0;
    let outgoing = 0;
    let transfers = 0;
    let payments = 0;

    for (const transaction of transactions) {
      const amount = Number(transaction.amount);
      const month = this.monthKey(transaction.created_at);
      const bucket = monthly.find((item) => item.month === month);
      if (amount >= 0) {
        income += amount;
        if (bucket) bucket.income += amount;
      } else {
        const absolute = Math.abs(amount);
        outgoing += absolute;
        if (bucket) bucket.outgoing += absolute;
        const category = this.categoryOf(transaction.description, transaction.type);
        categories.set(category, (categories.get(category) ?? 0) + absolute);
      }
      if (transaction.type === 'transfer') transfers += Math.abs(amount);
      if (transaction.type === 'payment' || transaction.type === 'debit')
        payments += Math.abs(amount);
    }

    return {
      kind: 'client' as const,
      periodMonths: months,
      summary: {
        bankBalance: Number(balances[0]?.bank_balance ?? 0),
        investmentValue: Number(balances[0]?.investment_value ?? 0),
        income,
        outgoing,
        payments,
        transfers,
        savingsRate: income > 0 ? ((income - outgoing) / income) * 100 : 0,
      },
      monthly,
      categories: [...categories.entries()]
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
      largestExpenses: transactions
        .filter((transaction) => Number(transaction.amount) < 0)
        .sort((a, b) => Number(a.amount) - Number(b.amount))
        .slice(0, 5)
        .map((transaction) => ({
          id: transaction.id,
          description: transaction.description,
          amount: Math.abs(Number(transaction.amount)),
          date: new Date(transaction.created_at).toISOString(),
        })),
    };
  }

  private async staffOverview(userId: string, scope: 'advisor' | 'director', months: number) {
    const clients = await this.dataSource.query<StaffClientRow[]>(
      scope === 'advisor'
        ? `SELECT client.id, client.first_name, client.last_name, client.email,
                  client.is_banned, client.last_login_at
           FROM advisor_clients link
           JOIN users client ON client.id = link.client_id
           WHERE link.advisor_id = $1
           ORDER BY client.last_name, client.first_name`
        : `SELECT DISTINCT client.id, client.first_name, client.last_name, client.email,
                  client.is_banned, client.last_login_at
           FROM users client
           JOIN user_roles user_role ON user_role.user_id = client.id
           JOIN roles role ON role.id = user_role.role_id AND role.name = 'CLIENT'
           ORDER BY client.last_name, client.first_name`,
      scope === 'advisor' ? [userId] : [],
    );
    const clientIds = clients.map((client) => client.id);
    if (clientIds.length === 0) return this.emptyStaffOverview(scope, months);

    const [financialRows, transactionRows, advisorRows] = await Promise.all([
      this.dataSource.query<FinancialRow[]>(
        `SELECT client.id,
                COALESCE((SELECT SUM(balance) FROM accounts WHERE user_id = client.id), 0) AS bank_balance,
                COALESCE((SELECT SUM(total_value) FROM investment_accounts WHERE user_id = client.id), 0) AS investment_value,
                (SELECT MAX(transaction.created_at) FROM bank_transactions transaction
                 JOIN accounts account ON account.id = transaction.account_id
                 WHERE account.user_id = client.id) AS last_transaction_at
         FROM users client WHERE client.id = ANY($1::uuid[])`,
        [clientIds],
      ),
      this.dataSource.query<StaffTransactionRow[]>(
        `SELECT transaction.amount, transaction.type, transaction.created_at
         FROM bank_transactions transaction
         JOIN accounts account ON account.id = transaction.account_id
         WHERE account.user_id = ANY($1::uuid[])
           AND transaction.created_at >= date_trunc('month', now()) - (($2::int - 1) * interval '1 month')`,
        [clientIds, months],
      ),
      scope === 'director'
        ? this.dataSource.query<AdvisorRow[]>(
            `SELECT advisor.id, advisor.first_name, advisor.last_name, COUNT(link.client_id)::int AS client_count
             FROM users advisor
             JOIN user_roles user_role ON user_role.user_id = advisor.id
             JOIN roles role ON role.id = user_role.role_id AND role.name = 'ADVISOR'
             LEFT JOIN advisor_clients link ON link.advisor_id = advisor.id
             GROUP BY advisor.id, advisor.first_name, advisor.last_name
             ORDER BY client_count DESC, advisor.last_name`,
          )
        : Promise.resolve<AdvisorRow[]>([]),
    ]);

    const financialById = new Map(financialRows.map((row) => [row.id, row]));
    const clientDetails: ClientDetail[] = clients.map((client) => {
      const financial = financialById.get(client.id);
      const bankBalance = Number(financial?.bank_balance ?? 0);
      const investmentValue = Number(financial?.investment_value ?? 0);
      return {
        id: client.id,
        name: `${client.first_name} ${client.last_name}`,
        email: client.email,
        bankBalance,
        investmentValue,
        totalAssets: bankBalance + investmentValue,
        isBanned: Boolean(client.is_banned),
        lastLoginAt: client.last_login_at,
        lastTransactionAt: financial?.last_transaction_at ?? null,
        needsAttention: Boolean(client.is_banned) || bankBalance < 0,
      };
    });

    const monthly = this.emptyMonths(months);
    let volume = 0;
    let outgoing = 0;
    let transactionCount = 0;
    for (const transaction of transactionRows) {
      const amount = Number(transaction.amount);
      const absolute = Math.abs(amount);
      volume += absolute;
      transactionCount += 1;
      if (amount < 0) outgoing += absolute;
      const bucket = monthly.find((item) => item.month === this.monthKey(transaction.created_at));
      if (bucket) {
        if (amount >= 0) bucket.income += amount;
        else bucket.outgoing += absolute;
      }
    }

    return {
      kind: 'staff' as const,
      scope,
      periodMonths: months,
      summary: {
        clientCount: clientDetails.length,
        bankAssets: clientDetails.reduce((sum, client) => sum + client.bankBalance, 0),
        investmentAssets: clientDetails.reduce((sum, client) => sum + client.investmentValue, 0),
        transactionVolume: volume,
        outgoing,
        transactionCount,
        attentionCount: clientDetails.filter((client) => client.needsAttention).length,
      },
      monthly,
      clients: clientDetails.sort((a, b) => b.totalAssets - a.totalAssets),
      advisorWorkload: advisorRows.map((row) => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        clientCount: Number(row.client_count),
      })),
    };
  }

  private emptyStaffOverview(scope: 'advisor' | 'director', months: number) {
    return {
      kind: 'staff' as const,
      scope,
      periodMonths: months,
      summary: {
        clientCount: 0,
        bankAssets: 0,
        investmentAssets: 0,
        transactionVolume: 0,
        outgoing: 0,
        transactionCount: 0,
        attentionCount: 0,
      },
      monthly: this.emptyMonths(months),
      clients: [],
      advisorWorkload: [],
    };
  }

  private emptyMonths(count: number) {
    const current = new Date();
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(
        Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - count + index + 1, 1),
      );
      return { month: this.monthKey(date), income: 0, outgoing: 0 };
    });
  }

  private monthKey(value: Date | string) {
    const date = new Date(value);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private categoryOf(description: string, type: string) {
    const value = description.toLocaleLowerCase('fr');
    if (/loyer|immobilier|assurance/.test(value)) return 'housing';
    if (/carrefour|course|supermarch|restaurant|food/.test(value)) return 'food';
    if (/netflix|spotify|abonnement|subscription/.test(value)) return 'subscriptions';
    if (/edf|énergie|energie|eau|téléphone|telephone|internet/.test(value)) return 'utilities';
    if (/transport|sncf|ratp|essence|carburant|auto/.test(value)) return 'transport';
    if (type === 'transfer' || /virement/.test(value)) return 'transfers';
    return 'other';
  }
}
