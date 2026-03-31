import { Collection, Db, MongoClient, WithId } from 'mongodb';
import { BankAccount, BankAccountStatus, BankAccountType } from '@forreal/domain/accounts/BankAccount';
import { IAccountRepository } from '@forreal/domain/accounts/ports/IAccountRepository';
import { BrokerageAccount, BrokerageAccountStatus } from '@forreal/domain/brokerage/BrokerageAccount';
import { IBrokerageRepository } from '@forreal/domain/brokerage/ports/IBrokerageRepository';
import { ITransactionRepository, TransactionType } from '@forreal/domain/transactions/ports/ITransactionRepository';

export type BankAccountDocument = {
  _id: string;
  userId: string;
  name: string;
  accountType: BankAccountType;
  balance: number;
  iban: string;
  accountNumber: string;
  status: BankAccountStatus;
  openedAt: Date;
};

export type BrokerageAccountDocument = {
  _id: string;
  userId: string;
  name: string;
  balance: number;
  totalValue: number;
  totalGainLoss: number;
  status: BrokerageAccountStatus;
  openedAt: Date;
};

export type BankTransactionDocument = {
  _id?: string;
  accountId: string;
  type: TransactionType;
  description: string;
  amount: number;
  balanceAfter: number;
  createdAt: Date;
};

export async function createMongoClient(uri: string): Promise<MongoClient> {
  const client = new MongoClient(uri);
  await client.connect();
  return client;
}

export function createMongoRepositories(db: Db) {
  const accountRepo = new MongoAccountRepository(
    db.collection<BankAccountDocument>('bank_accounts'),
  );
  const brokerageRepo = new MongoBrokerageRepository(
    db.collection<BrokerageAccountDocument>('brokerage_accounts'),
  );
  const transactionRepo = new MongoTransactionRepository(
    db.collection<BankTransactionDocument>('bank_transactions'),
  );

  return { accountRepo, brokerageRepo, transactionRepo };
}

export class MongoAccountRepository implements IAccountRepository {
  constructor(private readonly collection: Collection<BankAccountDocument>) {}

  async findBankAccountById(id: string): Promise<BankAccount | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async findBankAccountByIban(iban: string): Promise<BankAccount | null> {
    const doc = await this.collection.findOne({ iban });
    return doc ? this.map(doc) : null;
  }

  async listUserBankAccounts(userId: string): Promise<BankAccount[]> {
    const docs = await this.collection.find({ userId }).toArray();
    return docs.map((doc) => this.map(doc));
  }

  async updateBankAccountBalance(id: string, newBalance: number): Promise<void> {
    await this.collection.updateOne({ _id: id }, { $set: { balance: newBalance } });
  }

  private map(doc: WithId<BankAccountDocument>): BankAccount {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      name: doc.name,
      accountType: doc.accountType,
      balance: Number(doc.balance),
      iban: doc.iban,
      accountNumber: doc.accountNumber,
      status: doc.status,
      openedAt: doc.openedAt ? new Date(doc.openedAt) : new Date(),
    };
  }
}

export class MongoBrokerageRepository implements IBrokerageRepository {
  constructor(private readonly collection: Collection<BrokerageAccountDocument>) {}

  async findById(id: string): Promise<BrokerageAccount | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async listByUser(userId: string): Promise<BrokerageAccount[]> {
    const docs = await this.collection.find({ userId }).toArray();
    return docs.map((doc) => this.map(doc));
  }

  async updateCashBalance(id: string, newBalance: number): Promise<void> {
    await this.collection.updateOne({ _id: id }, { $set: { balance: newBalance } });
  }

  private map(doc: WithId<BrokerageAccountDocument>): BrokerageAccount {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      name: doc.name,
      balance: Number(doc.balance),
      totalValue: Number(doc.totalValue),
      totalGainLoss: Number(doc.totalGainLoss),
      status: doc.status,
      openedAt: doc.openedAt ? new Date(doc.openedAt) : new Date(),
    };
  }
}

export class MongoTransactionRepository implements ITransactionRepository {
  constructor(private readonly collection: Collection<BankTransactionDocument>) {}

  async createBankTransaction(params: {
    accountId: string;
    type: TransactionType;
    description: string;
    amount: number;
    balanceAfter: number;
  }): Promise<void> {
    await this.collection.insertOne({
      accountId: params.accountId,
      type: params.type,
      description: params.description,
      amount: params.amount,
      balanceAfter: params.balanceAfter,
      createdAt: new Date(),
    });
  }
}
