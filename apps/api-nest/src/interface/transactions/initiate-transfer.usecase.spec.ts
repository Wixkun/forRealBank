import { InitiateTransferUseCase } from '@forreal/application';
import type {
  IAccountRepository,
  IInvestmentRepository,
  ITransferGateway,
  ExecuteTransferInput,
  ExecuteTransferOutput,
  Account,
  InvestmentAccount,
} from '@forreal/domain';

const USER = 'user-1';
const OTHER = 'user-2';

function bankAccount(partial: Partial<Account> & { id: string }): Account {
  return {
    id: partial.id,
    userId: partial.userId ?? USER,
    name: partial.name ?? 'Compte Courant',
    accountType: partial.accountType ?? 'checking',
    balance: partial.balance ?? 1000,
    iban: partial.iban ?? `IBAN-${partial.id}`,
    accountNumber: partial.accountNumber ?? '****0001',
    interestRate: partial.interestRate ?? null,
    status: partial.status ?? 'active',
    openedAt: partial.openedAt ?? new Date(),
  };
}

class FakeAccountRepo implements IAccountRepository {
  constructor(private readonly accounts: Account[]) {}
  async findById(id: string) {
    return this.accounts.find((a) => a.id === id) ?? null;
  }
  async findByIban(iban: string) {
    return this.accounts.find((a) => a.iban === iban) ?? null;
  }
  async listByUser(userId: string) {
    return this.accounts.filter((a) => a.userId === userId);
  }
  async updateBalance() {
    /* non utilisé : le mouvement passe par le gateway */
  }
  async create(): Promise<Account> {
    /* non utilisé : l'ouverture de compte relève de l'onboarding */
    throw new Error('not implemented');
  }
}

class FakeInvestmentRepo implements IInvestmentRepository {
  constructor(private readonly accounts: InvestmentAccount[]) {}
  async findById(id: string) {
    return this.accounts.find((a) => a.id === id) ?? null;
  }
  async listByUser(userId: string) {
    return this.accounts.filter((a) => a.userId === userId);
  }
  async updateCashBalance() {}
  async createCashMovement() {}
  async create(): Promise<InvestmentAccount> {
    /* non utilisé : l'ouverture de compte relève de l'onboarding */
    throw new Error('not implemented');
  }
}

class SpyGateway implements ITransferGateway {
  public calls: ExecuteTransferInput[] = [];
  constructor(private readonly result: ExecuteTransferOutput) {}
  async execute(input: ExecuteTransferInput): Promise<ExecuteTransferOutput> {
    this.calls.push(input);
    return this.result;
  }
}

describe('InitiateTransferUseCase', () => {
  it('rejects a zero amount without touching the gateway', async () => {
    const gateway = new SpyGateway({
      status: 'completed',
      sourceBalance: 0,
      destinationBalance: 0,
    });
    const uc = new InitiateTransferUseCase(
      new FakeAccountRepo([]),
      new FakeInvestmentRepo([]),
      gateway,
    );
    const res = await uc.execute({
      userId: USER,
      sourceType: 'bank',
      sourceAccountId: 'a',
      destinationAccountId: 'b',
      amount: 0,
    });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Invalid amount/);
    expect(gateway.calls).toHaveLength(0);
  });

  it('rejects a negative amount', async () => {
    const gateway = new SpyGateway({
      status: 'completed',
      sourceBalance: 0,
      destinationBalance: 0,
    });
    const uc = new InitiateTransferUseCase(
      new FakeAccountRepo([]),
      new FakeInvestmentRepo([]),
      gateway,
    );
    const res = await uc.execute({
      userId: USER,
      sourceType: 'bank',
      sourceAccountId: 'a',
      destinationAccountId: 'b',
      amount: -50,
    });
    expect(res.success).toBe(false);
    expect(gateway.calls).toHaveLength(0);
  });

  it('rejects when the source account belongs to another user (IDOR)', async () => {
    const src = bankAccount({ id: 'a', userId: OTHER });
    const dst = bankAccount({ id: 'b', userId: USER });
    const gateway = new SpyGateway({
      status: 'completed',
      sourceBalance: 0,
      destinationBalance: 0,
    });
    const uc = new InitiateTransferUseCase(
      new FakeAccountRepo([src, dst]),
      new FakeInvestmentRepo([]),
      gateway,
    );
    const res = await uc.execute({
      userId: USER,
      sourceType: 'bank',
      sourceAccountId: 'a',
      destinationAccountId: 'b',
      amount: 100,
    });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Source account not found/);
    expect(gateway.calls).toHaveLength(0);
  });

  it('rejects an unknown destination', async () => {
    const src = bankAccount({ id: 'a', userId: USER });
    const gateway = new SpyGateway({
      status: 'completed',
      sourceBalance: 0,
      destinationBalance: 0,
    });
    const uc = new InitiateTransferUseCase(
      new FakeAccountRepo([src]),
      new FakeInvestmentRepo([]),
      gateway,
    );
    const res = await uc.execute({
      userId: USER,
      sourceType: 'bank',
      sourceAccountId: 'a',
      destinationAccountId: 'does-not-exist',
      amount: 100,
    });
    expect(res.success).toBe(false);
    expect(gateway.calls).toHaveLength(0);
  });

  it('forbids transferring to the same account', async () => {
    const src = bankAccount({ id: 'a', userId: USER });
    const gateway = new SpyGateway({
      status: 'completed',
      sourceBalance: 0,
      destinationBalance: 0,
    });
    const uc = new InitiateTransferUseCase(
      new FakeAccountRepo([src]),
      new FakeInvestmentRepo([]),
      gateway,
    );
    const res = await uc.execute({
      userId: USER,
      sourceType: 'bank',
      sourceAccountId: 'a',
      destinationAccountId: 'a',
      amount: 100,
    });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/same account/);
    expect(gateway.calls).toHaveLength(0);
  });

  it('forbids external IBAN transfer from a savings account', async () => {
    const src = bankAccount({ id: 'a', userId: USER, accountType: 'savings' });
    const external = bankAccount({ id: 'ext', userId: OTHER, iban: 'FR-EXT' });
    const gateway = new SpyGateway({
      status: 'completed',
      sourceBalance: 0,
      destinationBalance: 0,
    });
    const uc = new InitiateTransferUseCase(
      new FakeAccountRepo([src, external]),
      new FakeInvestmentRepo([]),
      gateway,
    );
    const res = await uc.execute({
      userId: USER,
      sourceType: 'bank',
      sourceAccountId: 'a',
      destinationIban: 'FR-EXT',
      amount: 100,
    });
    expect(res.success).toBe(false);
    expect(gateway.calls).toHaveLength(0);
  });

  it('delegates a valid transfer to the gateway and returns final balances', async () => {
    const src = bankAccount({ id: 'a', userId: USER, balance: 500 });
    const dst = bankAccount({ id: 'b', userId: USER, balance: 200 });
    const gateway = new SpyGateway({
      status: 'completed',
      sourceBalance: 400,
      destinationBalance: 300,
    });
    const uc = new InitiateTransferUseCase(
      new FakeAccountRepo([src, dst]),
      new FakeInvestmentRepo([]),
      gateway,
    );
    const res = await uc.execute({
      userId: USER,
      sourceType: 'bank',
      sourceAccountId: 'a',
      destinationAccountId: 'b',
      amount: 100,
      idempotencyKey: 'key-123',
    });
    expect(res.success).toBe(true);
    expect(res.sourceBalance).toBe(400);
    expect(res.destinationBalance).toBe(300);
    expect(gateway.calls).toHaveLength(1);
    expect(gateway.calls[0]).toMatchObject({
      source: { kind: 'bank', id: 'a' },
      destination: { kind: 'bank', id: 'b' },
      amount: 100,
      idempotencyKey: 'key-123',
    });
  });

  it('maps an insufficient-funds gateway result to a failure', async () => {
    const src = bankAccount({ id: 'a', userId: USER, balance: 10 });
    const dst = bankAccount({ id: 'b', userId: USER });
    const gateway = new SpyGateway({ status: 'insufficient_funds' });
    const uc = new InitiateTransferUseCase(
      new FakeAccountRepo([src, dst]),
      new FakeInvestmentRepo([]),
      gateway,
    );
    const res = await uc.execute({
      userId: USER,
      sourceType: 'bank',
      sourceAccountId: 'a',
      destinationAccountId: 'b',
      amount: 100,
    });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Insufficient funds/);
  });

  it('maps a duplicate gateway result to a failure (idempotency)', async () => {
    const src = bankAccount({ id: 'a', userId: USER });
    const dst = bankAccount({ id: 'b', userId: USER });
    const gateway = new SpyGateway({ status: 'duplicate' });
    const uc = new InitiateTransferUseCase(
      new FakeAccountRepo([src, dst]),
      new FakeInvestmentRepo([]),
      gateway,
    );
    const res = await uc.execute({
      userId: USER,
      sourceType: 'bank',
      sourceAccountId: 'a',
      destinationAccountId: 'b',
      amount: 100,
      idempotencyKey: 'dup',
    });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Duplicate/);
  });
});
