export type TransferAccountKind = 'bank' | 'investment';

export interface TransferParty {
  kind: TransferAccountKind;
  id: string;
}

export interface ExecuteTransferInput {
  source: TransferParty;
  destination: TransferParty;
  /** Montant strictement positif, déjà arrondi à 2 décimales par l'appelant. */
  amount: number;
  description: string;
  /**
   * Clé d'idempotence facultative. Si fournie et déjà traitée, l'opération
   * n'est pas rejouée (protection double-clic / retry réseau).
   */
  idempotencyKey?: string | null;
}

export type ExecuteTransferOutput =
  | {
      status: 'completed';
      sourceBalance: number;
      destinationBalance: number;
      /**
       * Ids des écritures comptables créées (lignes des relevés source et
       * destination). Permettent de relier la notification « Virement reçu »
       * aux transactions affichées dans les relevés (marquage lu à la
       * consultation, y compris pour un virement interne où l'utilisateur
       * peut consulter le débit comme le crédit).
       */
      sourceTransactionId?: string | null;
      destinationTransactionId?: string | null;
    }
  | { status: 'insufficient_funds' }
  | { status: 'duplicate' };

export const ITransferGateway = Symbol('ITransferGateway');

/**
 * Port du mouvement d'argent atomique.
 *
 * L'implémentation DOIT exécuter le débit de la source, le crédit de la
 * destination et les écritures comptables dans une seule transaction SQL :
 * soit tout est appliqué, soit rien. Le débit doit être atomique et
 * conditionné au solde (pas de solde négatif, pas de perte de mise à jour en
 * cas de virements concurrents).
 */
export interface ITransferGateway {
  execute(input: ExecuteTransferInput): Promise<ExecuteTransferOutput>;
}
