import { InitializeClientUseCase } from '@forreal/application';
import { AdvisorClient, RoleName } from '@forreal/domain';
import type {
  Account,
  Card,
  IAccountRepository,
  IAdvisorClientRepository,
  ICardRepository,
  IInvestmentRepository,
  InvestmentAccount,
  IUserRepository,
  User,
} from '@forreal/domain';

const CLIENT_ID = 'client-1';

function mkUser(id: string, roles: RoleName[], isBanned = false): User {
  return {
    id,
    firstName: id,
    lastName: 'User',
    roles: new Set(roles),
    isBanned,
  } as unknown as User;
}

function userRepo(users: User[]): IUserRepository {
  return {
    findById: jest.fn(async (id: string) => users.find((u) => u.id === id) ?? null),
    list: jest.fn(async () => users),
  } as unknown as IUserRepository;
}

// Mocks à état : l'idempotence se teste en rappelant le use case sur les
// mêmes stores en mémoire.
function accountRepo() {
  const accounts: Account[] = [];
  const repo = {
    listByUser: jest.fn(async (userId: string) => accounts.filter((a) => a.userId === userId)),
    create: jest.fn(async (params: Parameters<IAccountRepository['create']>[0]) => {
      const account: Account = {
        id: `acc-${accounts.length + 1}`,
        userId: params.userId,
        name: params.name,
        accountType: params.accountType,
        balance: 0,
        iban: params.iban,
        accountNumber: params.accountNumber,
        interestRate: params.interestRate ?? null,
        status: 'active',
        openedAt: new Date(),
      };
      accounts.push(account);
      return account;
    }),
  } as unknown as IAccountRepository;
  return { repo, accounts };
}

function investmentRepo() {
  const accounts: InvestmentAccount[] = [];
  const repo = {
    listByUser: jest.fn(async (userId: string) => accounts.filter((a) => a.userId === userId)),
    create: jest.fn(async (params: { userId: string; name: string }) => {
      const account: InvestmentAccount = {
        id: `inv-${accounts.length + 1}`,
        userId: params.userId,
        name: params.name,
        cashBalance: 0,
        totalValue: 0,
        totalGainLoss: 0,
        status: 'active',
        openedAt: new Date(),
      };
      accounts.push(account);
      return account;
    }),
  } as unknown as IInvestmentRepository;
  return { repo, accounts };
}

function cardRepo() {
  const cards: Card[] = [];
  const repo = {
    findByAccountId: jest.fn(async (accountId: string) =>
      cards.filter((c) => c.accountId === accountId),
    ),
    create: jest.fn(async (params: Parameters<ICardRepository['create']>[0]) => {
      const card: Card = {
        id: `card-${cards.length + 1}`,
        accountId: params.accountId,
        type: params.type,
        lastFour: params.lastFour,
        expiryDate: params.expiryDate,
        status: 'active',
        createdAt: new Date(),
      };
      cards.push(card);
      return card;
    }),
  } as unknown as ICardRepository;
  return { repo, cards };
}

// counts : nombre de clients déjà assignés par advisor.
function advisorClientRepo(
  counts: Record<string, number>,
  existingAdvisorId: string | null = null,
) {
  const links: Array<{ advisorId: string; clientId: string }> = [];
  const repo = {
    findAdvisorOf: jest.fn(async (clientId: string) => {
      const link = links.find((l) => l.clientId === clientId);
      if (link) return new AdvisorClient('l-new', link.advisorId, link.clientId, new Date());
      return existingAdvisorId
        ? new AdvisorClient('l-existing', existingAdvisorId, clientId, new Date())
        : null;
    }),
    countByAdvisorIds: jest.fn(async (ids: string[]) => {
      const out: Record<string, number> = {};
      for (const id of ids) out[id] = counts[id] ?? 0;
      return out;
    }),
    link: jest.fn(async (advisorId: string, clientId: string) => {
      links.push({ advisorId, clientId });
      return new AdvisorClient('l-new', advisorId, clientId, new Date());
    }),
  } as unknown as IAdvisorClientRepository;
  return { repo, links };
}

const CLIENT = mkUser(CLIENT_ID, [RoleName.CLIENT]);
const ADVISOR_A = mkUser('advisor-a', [RoleName.ADVISOR]);
const ADVISOR_B = mkUser('advisor-b', [RoleName.ADVISOR]);
const ADVISOR_C = mkUser('advisor-c', [RoleName.ADVISOR]);

function makeUseCase(options?: {
  users?: User[];
  counts?: Record<string, number>;
  existingAdvisorId?: string | null;
  random?: () => number;
}) {
  const accounts = accountRepo();
  const investments = investmentRepo();
  const cards = cardRepo();
  const advisorClients = advisorClientRepo(
    options?.counts ?? {},
    options?.existingAdvisorId ?? null,
  );
  const uc = new InitializeClientUseCase(
    userRepo(options?.users ?? [CLIENT, ADVISOR_A]),
    accounts.repo,
    investments.repo,
    cards.repo,
    advisorClients.repo,
    options?.random ?? Math.random,
  );
  return { uc, accounts, investments, cards, advisorClients };
}

describe('InitializeClientUseCase', () => {
  it('creates the three accounts (CHECKING, SAVINGS, INVESTMENT)', async () => {
    const { uc, accounts, investments } = makeUseCase();

    const res = await uc.execute({ userId: CLIENT_ID });

    expect(res.initialized).toBe(true);
    expect(res.createdAccounts.sort()).toEqual(['CHECKING', 'INVESTMENT', 'SAVINGS']);
    expect(accounts.accounts.map((a) => a.accountType).sort()).toEqual(['checking', 'savings']);
    expect(investments.accounts).toHaveLength(1);
    // Épargne rémunérée, courant non (mêmes règles que les comptes existants).
    expect(accounts.accounts.find((a) => a.accountType === 'savings')?.interestRate).toBe(2.5);
    expect(accounts.accounts.find((a) => a.accountType === 'checking')?.interestRate).toBeNull();
    // IBAN au format du projet.
    for (const account of accounts.accounts) {
      expect(account.iban).toMatch(/^FR76( \d{1,4}){6}$/);
    }
  });

  it('creates exactly one card, attached to the CHECKING account only', async () => {
    const { uc, accounts, cards } = makeUseCase();

    const res = await uc.execute({ userId: CLIENT_ID });

    const checking = accounts.accounts.find((a) => a.accountType === 'checking');
    expect(res.cardCreated).toBe(true);
    expect(cards.cards).toHaveLength(1);
    expect(cards.cards[0].accountId).toBe(checking!.id);
    expect(cards.cards[0].type).toBe('virtual');
    // Convention existante : le numéro de compte courant reprend les 4
    // derniers chiffres de la carte.
    expect(checking!.accountNumber).toBe(`****${cards.cards[0].lastFour}`);
  });

  it('assigns the advisor with the fewest clients', async () => {
    const { uc, advisorClients } = makeUseCase({
      users: [CLIENT, ADVISOR_A, ADVISOR_B, ADVISOR_C],
      counts: { 'advisor-a': 10, 'advisor-b': 7, 'advisor-c': 9 },
    });

    const res = await uc.execute({ userId: CLIENT_ID });

    expect(res.advisorAssigned).toBe(true);
    expect(res.advisorId).toBe('advisor-b');
    expect(advisorClients.links).toEqual([{ advisorId: 'advisor-b', clientId: CLIENT_ID }]);
  });

  it('picks randomly among tied least-loaded advisors', async () => {
    const setup = {
      users: [CLIENT, ADVISOR_A, ADVISOR_B, ADVISOR_C],
      counts: { 'advisor-a': 10, 'advisor-b': 7, 'advisor-c': 7 },
    };

    // random → 0 : premier ex æquo ; random → 0.99 : dernier ex æquo.
    const first = makeUseCase({ ...setup, random: () => 0 });
    const last = makeUseCase({ ...setup, random: () => 0.99 });

    const resFirst = await first.uc.execute({ userId: CLIENT_ID });
    const resLast = await last.uc.execute({ userId: CLIENT_ID });

    expect(['advisor-b', 'advisor-c']).toContain(resFirst.advisorId);
    expect(['advisor-b', 'advisor-c']).toContain(resLast.advisorId);
    // Les deux tirages atteignent des ex æquo différents : le choix dépend
    // bien de l'aléa, jamais d'un advisor hors égalité.
    expect(resFirst.advisorId).not.toBe(resLast.advisorId);
  });

  it('still creates accounts when no advisor is available, and reports it', async () => {
    const bannedAdvisor = mkUser('advisor-banned', [RoleName.ADVISOR], true);
    const { uc, accounts, investments, advisorClients } = makeUseCase({
      users: [CLIENT, bannedAdvisor],
    });

    const res = await uc.execute({ userId: CLIENT_ID });

    expect(res.initialized).toBe(true);
    expect(res.advisorAssigned).toBe(false);
    expect(res.advisorId).toBeNull();
    expect(advisorClients.links).toEqual([]);
    expect(accounts.accounts).toHaveLength(2);
    expect(investments.accounts).toHaveLength(1);
  });

  it('is idempotent: a second call creates no duplicate account, card or link', async () => {
    const { uc, accounts, investments, cards, advisorClients } = makeUseCase();

    const firstRun = await uc.execute({ userId: CLIENT_ID });
    const secondRun = await uc.execute({ userId: CLIENT_ID });

    expect(firstRun.createdAccounts).toHaveLength(3);
    expect(secondRun.createdAccounts).toHaveLength(0);
    expect(secondRun.cardCreated).toBe(false);
    expect(secondRun.advisorAssigned).toBe(false);
    expect(accounts.accounts).toHaveLength(2);
    expect(investments.accounts).toHaveLength(1);
    expect(cards.cards).toHaveLength(1);
    expect(advisorClients.links).toHaveLength(1);
    // Le conseiller déjà attribué est conservé.
    expect(secondRun.advisorId).toBe(firstRun.advisorId);
  });

  it('keeps the existing advisor of an already-linked client', async () => {
    const { uc, advisorClients } = makeUseCase({
      users: [CLIENT, ADVISOR_A, ADVISOR_B],
      counts: { 'advisor-a': 0, 'advisor-b': 0 },
      existingAdvisorId: 'advisor-b',
    });

    const res = await uc.execute({ userId: CLIENT_ID });

    expect(res.advisorId).toBe('advisor-b');
    expect(res.advisorAssigned).toBe(false);
    expect(advisorClients.links).toEqual([]);
  });

  it('skips non-client users entirely', async () => {
    const advisorUser = mkUser('some-advisor', [RoleName.ADVISOR]);
    const { uc, accounts, cards } = makeUseCase({ users: [advisorUser] });

    const res = await uc.execute({ userId: 'some-advisor' });

    expect(res.initialized).toBe(false);
    expect(res.skippedReason).toBe('NOT_CLIENT');
    expect(accounts.accounts).toHaveLength(0);
    expect(cards.cards).toHaveLength(0);
  });
});
