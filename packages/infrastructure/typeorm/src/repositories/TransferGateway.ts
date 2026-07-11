import { DataSource, EntityManager } from 'typeorm';
import {
  ITransferGateway,
  ExecuteTransferInput,
  ExecuteTransferOutput,
  TransferParty,
} from '@forreal/domain';

// Signal interne utilisé pour déclencher le rollback de la transaction lorsque
// le solde de la source est insuffisant (afin que la clé d'idempotence
// éventuellement insérée soit elle aussi annulée).
class InsufficientFundsSignal extends Error {}

interface AccountSqlShape {
  table: 'accounts' | 'investment_accounts';
  balanceColumn: 'balance' | 'cash_balance';
}

function sqlShape(party: TransferParty): AccountSqlShape {
  return party.kind === 'bank'
    ? { table: 'accounts', balanceColumn: 'balance' }
    : { table: 'investment_accounts', balanceColumn: 'cash_balance' };
}

export class TransferGateway implements ITransferGateway {
  constructor(private readonly dataSource: DataSource) {}

  async execute(input: ExecuteTransferInput): Promise<ExecuteTransferOutput> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        // 1) Idempotence : la première occurrence de la clé est insérée, une
        //    répétition renvoie « duplicate » sans rejouer le mouvement.
        if (input.idempotencyKey) {
          const inserted: unknown[] = await manager.query(
            `INSERT INTO transfer_idempotency_keys (key)
             VALUES ($1)
             ON CONFLICT (key) DO NOTHING
             RETURNING key`,
            [input.idempotencyKey],
          );
          if (inserted.length === 0) {
            return { status: 'duplicate' as const };
          }
        }

        // 2) Verrouillage des deux comptes dans un ordre déterministe
        //    (tri stable) pour éviter les interblocages entre virements croisés.
        const ordered = [input.source, input.destination].sort((a, b) => {
          const ka = `${a.kind}:${a.id}`;
          const kb = `${b.kind}:${b.id}`;
          return ka < kb ? -1 : ka > kb ? 1 : 0;
        });
        for (const party of ordered) {
          await this.lockRow(manager, party);
        }

        // 3) Débit atomique et conditionné : la ligne n'est modifiée que si le
        //    solde reste positif. Aucune valeur absolue lue en mémoire.
        const newSourceBalance = await this.decrementIfSufficient(
          manager,
          input.source,
          input.amount,
        );
        if (newSourceBalance === null) {
          throw new InsufficientFundsSignal();
        }
        const sourceTransactionId = await this.writeLedger(
          manager,
          input.source,
          'out',
          input.amount,
          newSourceBalance,
          input.description,
        );

        // 4) Crédit de la destination dans la même transaction.
        const newDestinationBalance = await this.increment(
          manager,
          input.destination,
          input.amount,
        );
        if (newDestinationBalance === null) {
          throw new Error('TRANSFER_DESTINATION_NOT_FOUND');
        }
        const destinationTransactionId = await this.writeLedger(
          manager,
          input.destination,
          'in',
          input.amount,
          newDestinationBalance,
          input.description,
        );

        return {
          status: 'completed' as const,
          sourceBalance: newSourceBalance,
          destinationBalance: newDestinationBalance,
          sourceTransactionId,
          destinationTransactionId,
        };
      });
    } catch (error) {
      if (error instanceof InsufficientFundsSignal) {
        return { status: 'insufficient_funds' };
      }
      throw error;
    }
  }

  private async lockRow(manager: EntityManager, party: TransferParty): Promise<void> {
    const { table } = sqlShape(party);
    await manager.query(`SELECT 1 FROM ${table} WHERE id = $1 FOR UPDATE`, [party.id]);
  }

  private async decrementIfSufficient(
    manager: EntityManager,
    party: TransferParty,
    amount: number,
  ): Promise<number | null> {
    const { table, balanceColumn } = sqlShape(party);
    const rows: Array<{ balance: string }> = await manager.query(
      `UPDATE ${table}
       SET ${balanceColumn} = ${balanceColumn} - $1
       WHERE id = $2 AND ${balanceColumn} >= $1
       RETURNING ${balanceColumn} AS balance`,
      [amount, party.id],
    );
    return rows.length > 0 ? Number(rows[0].balance) : null;
  }

  private async increment(
    manager: EntityManager,
    party: TransferParty,
    amount: number,
  ): Promise<number | null> {
    const { table, balanceColumn } = sqlShape(party);
    const rows: Array<{ balance: string }> = await manager.query(
      `UPDATE ${table}
       SET ${balanceColumn} = ${balanceColumn} + $1
       WHERE id = $2
       RETURNING ${balanceColumn} AS balance`,
      [amount, party.id],
    );
    return rows.length > 0 ? Number(rows[0].balance) : null;
  }

  // Renvoie l'id de l'écriture insérée (utilisé pour relier la notification
  // « Virement reçu » à la ligne du relevé du destinataire).
  private async writeLedger(
    manager: EntityManager,
    party: TransferParty,
    direction: 'in' | 'out',
    amount: number,
    balanceAfter: number,
    description: string,
  ): Promise<string | null> {
    if (party.kind === 'bank') {
      const type = direction === 'out' ? 'debit' : 'transfer';
      // Convention existante : les débits sont stockés en montant négatif.
      const signedAmount = direction === 'out' ? -amount : amount;
      const rows: Array<{ id: string }> = await manager.query(
        `INSERT INTO bank_transactions (account_id, type, description, amount, balance_after)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [party.id, type, description, signedAmount, balanceAfter],
      );
      return rows[0]?.id ?? null;
    }

    const type = direction === 'out' ? 'withdrawal' : 'deposit';
    const rows: Array<{ id: string }> = await manager.query(
      `INSERT INTO investment_transactions (investment_account_id, type, description, amount, cash_balance_after)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [party.id, type, description, amount, balanceAfter],
    );
    return rows[0]?.id ?? null;
  }
}
