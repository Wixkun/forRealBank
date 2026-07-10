import { DataSource } from 'typeorm';
import { TransferGateway } from '@forreal/infrastructure-typeorm';

// Test d'intégration RÉEL contre PostgreSQL. Il vérifie l'atomicité, le
// décrément conditionnel, la concurrence et l'idempotence au niveau base — et
// non via des mocks. Il est ignoré si aucune base n'est fournie via
// TEST_DATABASE_URL.
//
// Pour l'exécuter :
//   docker compose up -d db
//   TEST_DATABASE_URL=postgres://forreal:forreal@localhost:5432/forrealbank \
//     pnpm --filter api-nest exec jest transfer-gateway.integration
const url = process.env.TEST_DATABASE_URL;
const describeDb = url ? describe : describe.skip;

describeDb('TransferGateway (integration)', () => {
  let ds: DataSource;
  let gateway: TransferGateway;

  const SCHEMA = 'transfer_gateway_test';

  beforeAll(async () => {
    ds = new DataSource({ type: 'postgres', url, entities: [] });
    await ds.initialize();
    await ds.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await ds.query(`CREATE SCHEMA ${SCHEMA}`);
    await ds.query(`SET search_path TO ${SCHEMA}`);

    await ds.query(`
      CREATE TABLE accounts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        balance numeric(15,2) NOT NULL DEFAULT 0
      )`);
    await ds.query(`
      CREATE TABLE investment_accounts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        cash_balance numeric(15,2) NOT NULL DEFAULT 0
      )`);
    await ds.query(`
      CREATE TABLE bank_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id uuid NOT NULL,
        type varchar(20) NOT NULL,
        description text NOT NULL,
        amount numeric(15,2) NOT NULL,
        balance_after numeric(15,2) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )`);
    await ds.query(`
      CREATE TABLE investment_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        investment_account_id uuid NOT NULL,
        type varchar(20) NOT NULL,
        description text NOT NULL,
        amount numeric(15,2) NOT NULL,
        cash_balance_after numeric(15,2) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )`);
    await ds.query(`
      CREATE TABLE transfer_idempotency_keys (
        key text PRIMARY KEY,
        created_at timestamptz NOT NULL DEFAULT now()
      )`);

    gateway = new TransferGateway(ds);
  });

  afterAll(async () => {
    if (ds?.isInitialized) {
      await ds.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
      await ds.destroy();
    }
  });

  async function seedAccounts(sourceBalance: number, destBalance: number) {
    await ds.query(`TRUNCATE accounts, bank_transactions, transfer_idempotency_keys`);
    const [{ id: sourceId }] = await ds.query(
      `INSERT INTO accounts (balance) VALUES ($1) RETURNING id`,
      [sourceBalance],
    );
    const [{ id: destId }] = await ds.query(
      `INSERT INTO accounts (balance) VALUES ($1) RETURNING id`,
      [destBalance],
    );
    return { sourceId, destId };
  }

  async function balanceOf(id: string): Promise<number> {
    const [row] = await ds.query(`SELECT balance FROM accounts WHERE id = $1`, [id]);
    return Number(row.balance);
  }

  it('applies debit, credit and two ledger rows atomically', async () => {
    const { sourceId, destId } = await seedAccounts(100, 100);
    const result = await gateway.execute({
      source: { kind: 'bank', id: sourceId },
      destination: { kind: 'bank', id: destId },
      amount: 30,
      description: 'test',
    });
    expect(result.status).toBe('completed');
    expect(await balanceOf(sourceId)).toBe(70);
    expect(await balanceOf(destId)).toBe(130);
    const ledger = await ds.query(`SELECT count(*)::int AS n FROM bank_transactions`);
    expect(ledger[0].n).toBe(2);
  });

  it('refuses to overdraw and leaves balances untouched', async () => {
    const { sourceId, destId } = await seedAccounts(50, 0);
    const result = await gateway.execute({
      source: { kind: 'bank', id: sourceId },
      destination: { kind: 'bank', id: destId },
      amount: 1000,
      description: 'test',
    });
    expect(result.status).toBe('insufficient_funds');
    expect(await balanceOf(sourceId)).toBe(50);
    expect(await balanceOf(destId)).toBe(0);
    const ledger = await ds.query(`SELECT count(*)::int AS n FROM bank_transactions`);
    expect(ledger[0].n).toBe(0);
  });

  it('never lets concurrent transfers overspend the same balance', async () => {
    const { sourceId, destId } = await seedAccounts(100, 0);
    const [a, b] = await Promise.all([
      gateway.execute({
        source: { kind: 'bank', id: sourceId },
        destination: { kind: 'bank', id: destId },
        amount: 60,
        description: 'c1',
      }),
      gateway.execute({
        source: { kind: 'bank', id: sourceId },
        destination: { kind: 'bank', id: destId },
        amount: 60,
        description: 'c2',
      }),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual(['completed', 'insufficient_funds']);
    expect(await balanceOf(sourceId)).toBe(40); // jamais négatif
    expect(await balanceOf(destId)).toBe(60);
  });

  it('is idempotent: the same key is applied only once', async () => {
    const { sourceId, destId } = await seedAccounts(100, 0);
    const first = await gateway.execute({
      source: { kind: 'bank', id: sourceId },
      destination: { kind: 'bank', id: destId },
      amount: 25,
      description: 'idem',
      idempotencyKey: 'same-key',
    });
    const second = await gateway.execute({
      source: { kind: 'bank', id: sourceId },
      destination: { kind: 'bank', id: destId },
      amount: 25,
      description: 'idem',
      idempotencyKey: 'same-key',
    });
    expect(first.status).toBe('completed');
    expect(second.status).toBe('duplicate');
    expect(await balanceOf(sourceId)).toBe(75); // un seul débit
  });
});
