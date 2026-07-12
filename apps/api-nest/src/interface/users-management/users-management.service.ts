import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import {
  AccountEntity,
  AdvisorClientEntity,
  BankTransactionEntity,
  BanRequestEntity,
  InvestmentAccountEntity,
  InvestmentTransactionEntity,
  UserEntity,
} from '@forreal/infrastructure-typeorm';
import { RoleName } from '@forreal/domain';

export interface ManagementActor {
  userId: string;
  roles: RoleName[];
}

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

const DIRECTORY_LIMIT = 500;

function isPrivileged(actor: ManagementActor): boolean {
  return actor.roles.includes(RoleName.DIRECTOR) || actor.roles.includes(RoleName.ADMIN);
}

/**
 * Lectures de la page de gestion des utilisateurs. TOUT le périmètre est
 * appliqué ici, côté serveur : un advisor n'obtient jamais que SES clients
 * (relation advisor_clients), quelle que soit la requête envoyée — on ne
 * récupère jamais tout pour filtrer ensuite dans le frontend.
 */
@Injectable()
export class UsersManagementService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(AdvisorClientEntity)
    private readonly advisorClients: Repository<AdvisorClientEntity>,
    @InjectRepository(AccountEntity) private readonly accounts: Repository<AccountEntity>,
    @InjectRepository(InvestmentAccountEntity)
    private readonly investmentAccounts: Repository<InvestmentAccountEntity>,
    @InjectRepository(BankTransactionEntity)
    private readonly bankTransactions: Repository<BankTransactionEntity>,
    @InjectRepository(InvestmentTransactionEntity)
    private readonly investmentTransactions: Repository<InvestmentTransactionEntity>,
    @InjectRepository(BanRequestEntity)
    private readonly banRequests: Repository<BanRequestEntity>,
  ) {}

  // ─── Annuaire ──────────────────────────────────────────────────────────────

  async listDirectory(
    actor: ManagementActor,
    role: 'ADVISOR' | 'CLIENT',
    search?: string,
  ): Promise<DirectoryUser[]> {
    if (role === 'ADVISOR' && !isPrivileged(actor)) {
      throw new ForbiddenException('Advisors cannot list other advisors');
    }

    const qb = this.users
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role', 'role.name = :roleName', { roleName: role })
      .orderBy('user.lastName', 'ASC')
      .addOrderBy('user.firstName', 'ASC')
      .take(DIRECTORY_LIMIT);

    // Périmètre advisor : uniquement SES clients (jointure sur la relation).
    if (role === 'CLIENT' && !isPrivileged(actor)) {
      qb.innerJoin(
        'advisor_clients',
        'link',
        'link.client_id = user.id AND link.advisor_id = :actorId',
        { actorId: actor.userId },
      );
    }

    const term = (search ?? '').trim();
    if (term) {
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('user.firstName ILIKE :term', { term: `%${term}%` })
            .orWhere('user.lastName ILIKE :term', { term: `%${term}%` })
            .orWhere('user.email ILIKE :term', { term: `%${term}%` })
            .orWhere(`(user.firstName || ' ' || user.lastName) ILIKE :term`, {
              term: `%${term}%`,
            });
        }),
      );
    }

    const entities = await qb.getMany();
    const base = entities.map((u) => this.toDirectoryUser(u));

    if (role === 'ADVISOR') {
      await this.attachClientCounts(base);
    } else {
      await this.attachAdvisors(base);
    }
    return base;
  }

  // ─── Fiche détaillée ───────────────────────────────────────────────────────

  async getUserDetails(actor: ManagementActor, targetId: string) {
    await this.assertCanViewUser(actor, targetId);

    const user = await this.users.findOne({ where: { id: targetId }, relations: ['roles'] });
    if (!user) throw new NotFoundException('User not found');

    const roles = (user.roles ?? []).map((r) => r.name);
    const details: Record<string, unknown> = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles,
      isBanned: user.isBanned,
      lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
      createdAt: user.createdAt?.toISOString() ?? null,
    };

    if (roles.includes(RoleName.CLIENT)) {
      const link = await this.advisorClients.findOne({
        where: { client: { id: targetId } },
        relations: ['advisor'],
      });
      details.advisor = link?.advisor
        ? {
            id: link.advisor.id,
            firstName: link.advisor.firstName,
            lastName: link.advisor.lastName,
          }
        : null;

      // L'advisor connecté a-t-il déjà une demande de bannissement en attente
      // pour ce client ? (le bouton « Demander le bannissement » se masque)
      if (!isPrivileged(actor)) {
        const pending = await this.banRequests.count({
          where: { clientId: targetId, advisorRequesterId: actor.userId, status: 'PENDING' },
        });
        details.hasPendingBanRequest = pending > 0;
      }
    }

    if (roles.includes(RoleName.ADVISOR)) {
      const links = await this.advisorClients.find({
        where: { advisor: { id: targetId } },
        relations: ['client'],
      });
      details.clientCount = links.length;
      details.clients = links
        .filter((l) => l.client)
        .map((l) => ({
          id: l.client.id,
          firstName: l.client.firstName,
          lastName: l.client.lastName,
          isBanned: l.client.isBanned,
        }))
        .sort((a, b) =>
          `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`),
        );
    }

    return details;
  }

  // ─── Comptes & transactions (lecture seule) ───────────────────────────────

  async listClientAccounts(actor: ManagementActor, clientId: string) {
    await this.assertCanViewClientBanking(actor, clientId);

    const [bank, investments] = await Promise.all([
      this.accounts.find({ where: { userId: clientId }, order: { createdAt: 'ASC' } }),
      this.investmentAccounts.find({ where: { userId: clientId }, order: { createdAt: 'ASC' } }),
    ]);

    return {
      accounts: bank.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.accountType,
        balance: Number(a.balance),
        currency: 'EUR',
        iban: a.iban,
        accountNumber: a.accountNumber,
        interestRate: a.interestRate !== null ? Number(a.interestRate) : null,
        status: a.status,
        openedAt: a.openedAt?.toISOString() ?? null,
      })),
      investmentAccounts: investments.map((a) => ({
        id: a.id,
        name: a.name,
        type: 'investment' as const,
        cashBalance: Number(a.cashBalance),
        totalValue: Number(a.totalValue),
        totalGainLoss: Number(a.totalGainLoss),
        currency: 'EUR',
        status: a.status,
        openedAt: a.openedAt?.toISOString() ?? null,
      })),
    };
  }

  /**
   * Transactions d'un compte bancaire d'un client autorisé. Filtre de période
   * appliqué en SQL. Lecture seule : aucune écriture possible par ce module.
   */
  async listBankTransactions(
    actor: ManagementActor,
    accountId: string,
    range: { from?: string; to?: string },
  ) {
    const account = await this.accounts.findOne({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Account not found');
    await this.assertCanViewClientBanking(actor, account.userId);

    const qb = this.bankTransactions
      .createQueryBuilder('t')
      .where('t.account_id = :accountId', { accountId })
      .orderBy('t.created_at', 'DESC')
      .take(1000);
    this.applyRange(qb, 't', range);

    const rows = await qb.getMany();
    return rows.map((t) => ({
      id: t.id,
      date: t.createdAt.toISOString(),
      description: t.description,
      type: t.type,
      amount:
        t.type === 'credit' || t.type === 'transfer'
          ? Math.abs(Number(t.amount))
          : -Math.abs(Number(t.amount)),
      balance: Number(t.balanceAfter),
    }));
  }

  /**
   * Mouvements MONÉTAIRES d'un compte investissement (dépôts, retraits,
   * transferts) : jamais les ordres d'achat/vente ni la valorisation — le
   * relevé Investment ne contient que ces mouvements.
   */
  async listInvestmentCashMovements(
    actor: ManagementActor,
    accountId: string,
    range: { from?: string; to?: string },
  ) {
    const account = await this.investmentAccounts.findOne({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Account not found');
    await this.assertCanViewClientBanking(actor, account.userId);

    const qb = this.investmentTransactions
      .createQueryBuilder('t')
      .where('t.investment_account_id = :accountId', { accountId })
      .orderBy('t.created_at', 'DESC')
      .take(1000);
    this.applyRange(qb, 't', range);

    const rows = await qb.getMany();
    return rows.map((t) => ({
      id: t.id,
      date: t.createdAt.toISOString(),
      description: t.description,
      type: t.type,
      amount: t.type === 'deposit' ? Math.abs(Number(t.amount)) : -Math.abs(Number(t.amount)),
      balance: Number(t.cashBalanceAfter),
    }));
  }

  // ─── Périmètre (source de vérité) ─────────────────────────────────────────

  /** Fiche : director/admin → tous ; advisor → lui-même et SES clients. */
  async assertCanViewUser(actor: ManagementActor, targetId: string): Promise<void> {
    if (isPrivileged(actor) || targetId === actor.userId) return;
    if (!actor.roles.includes(RoleName.ADVISOR)) {
      throw new ForbiddenException('Access denied');
    }
    await this.assertAdvisorOwnsClient(actor.userId, targetId);
  }

  /** Données bancaires : director/admin → tous ; advisor → SES clients. */
  async assertCanViewClientBanking(actor: ManagementActor, ownerId: string): Promise<void> {
    if (isPrivileged(actor)) return;
    if (!actor.roles.includes(RoleName.ADVISOR)) {
      throw new ForbiddenException('Access denied');
    }
    await this.assertAdvisorOwnsClient(actor.userId, ownerId);
  }

  async assertAdvisorOwnsClient(advisorId: string, clientId: string): Promise<void> {
    const link = await this.advisorClients.findOne({
      where: { advisor: { id: advisorId }, client: { id: clientId } },
    });
    if (!link) throw new ForbiddenException('This client is not assigned to you');
  }

  // ─── Helpers privés ────────────────────────────────────────────────────────

  private applyRange<T extends { createdAt: Date }>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    range: { from?: string; to?: string },
  ): void {
    if (range.from) {
      qb.andWhere(`${alias}.created_at >= :from`, { from: new Date(`${range.from}T00:00:00`) });
    }
    if (range.to) {
      qb.andWhere(`${alias}.created_at <= :to`, { to: new Date(`${range.to}T23:59:59.999`) });
    }
  }

  private toDirectoryUser(u: UserEntity): DirectoryUser {
    return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      isBanned: u.isBanned,
      lastSeenAt: u.lastSeenAt?.toISOString() ?? null,
      createdAt: u.createdAt?.toISOString() ?? '',
    };
  }

  private async attachClientCounts(advisors: DirectoryUser[]): Promise<void> {
    if (advisors.length === 0) return;
    const rows: Array<{ advisor_id: string; count: string }> = await this.advisorClients.query(
      `SELECT advisor_id, COUNT(*) AS count FROM advisor_clients
       WHERE advisor_id = ANY($1) GROUP BY advisor_id`,
      [advisors.map((a) => a.id)],
    );
    const counts = new Map(rows.map((r) => [r.advisor_id, Number(r.count)]));
    for (const advisor of advisors) advisor.clientCount = counts.get(advisor.id) ?? 0;
  }

  private async attachAdvisors(clients: DirectoryUser[]): Promise<void> {
    if (clients.length === 0) return;
    const rows: Array<{
      client_id: string;
      advisor_id: string;
      first_name: string;
      last_name: string;
    }> = await this.advisorClients.query(
      `SELECT ac.client_id, ac.advisor_id, u.first_name, u.last_name
       FROM advisor_clients ac JOIN users u ON u.id = ac.advisor_id
       WHERE ac.client_id = ANY($1)`,
      [clients.map((c) => c.id)],
    );
    const byClient = new Map(
      rows.map((r) => [
        r.client_id,
        { id: r.advisor_id, firstName: r.first_name, lastName: r.last_name },
      ]),
    );
    for (const client of clients) client.advisor = byClient.get(client.id) ?? null;
  }
}
