import {
  IAccountRepository,
  IInvestmentRepository,
  ITransferGateway,
  TransferParty,
  Account,
  InvestmentAccount,
} from '@forreal/domain';

export type TransferRequest = {
  userId: string;
  sourceType: 'bank' | 'investment';
  sourceAccountId: string;
  destinationAccountId?: string;
  destinationIban?: string;
  amount: number;
  description?: string;
  idempotencyKey?: string | null;
};

export type TransferResult = {
  success: boolean;
  message: string;
  sourceBalance?: number;
  destinationBalance?: number;
};

// Arrondi monétaire à 2 décimales (les colonnes SQL sont numeric(15,2)).
function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Orchestration métier d'un virement. La validation (montant, propriété des
 * comptes, règles épargne/IBAN, anti-auto-virement) est faite ici ; le
 * mouvement d'argent lui-même est délégué à un port atomique et transactionnel
 * (ITransferGateway) — aucune logique SQL ni verrou dans l'application.
 */
export class InitiateTransferUseCase {
  constructor(
    private readonly accountRepo: IAccountRepository,
    private readonly investmentRepo: IInvestmentRepository,
    private readonly transferGateway: ITransferGateway,
  ) {}

  async execute(req: TransferRequest): Promise<TransferResult> {
    // ── Validation du montant ────────────────────────────────────────────────
    if (typeof req.amount !== 'number' || !Number.isFinite(req.amount) || req.amount <= 0) {
      return { success: false, message: 'Invalid amount' };
    }
    const amount = roundMoney(req.amount);
    if (amount <= 0) {
      return { success: false, message: 'Invalid amount' };
    }

    if (!req.sourceAccountId) {
      return { success: false, message: 'Missing source account' };
    }

    // ── Résolution + validation de la source (propriété) ─────────────────────
    let source: TransferParty;
    let sourceAccountType: 'checking' | 'savings' | null = null;

    if (req.sourceType === 'bank') {
      const bank = await this.accountRepo.findById(req.sourceAccountId);
      if (!bank || bank.userId !== req.userId) {
        return { success: false, message: 'Source account not found' };
      }
      sourceAccountType = bank.accountType;
      source = { kind: 'bank', id: bank.id };
    } else {
      const investment = await this.investmentRepo.findById(req.sourceAccountId);
      if (!investment || investment.userId !== req.userId) {
        return { success: false, message: 'Investment source not found' };
      }
      if (req.destinationIban) {
        return { success: false, message: 'Investment account cannot transfer to external IBAN' };
      }
      source = { kind: 'investment', id: investment.id };
    }

    // ── Résolution + validation de la destination ────────────────────────────
    const resolvedDestination = await this.resolveDestination(req, sourceAccountType);
    if ('error' in resolvedDestination) {
      return { success: false, message: resolvedDestination.error };
    }
    const destination = resolvedDestination.party;

    // ── Anti-auto-virement : source et destination identiques interdits ──────
    if (source.kind === destination.kind && source.id === destination.id) {
      return { success: false, message: 'Cannot transfer to the same account' };
    }

    // ── Mouvement atomique délégué au gateway ────────────────────────────────
    const outcome = await this.transferGateway.execute({
      source,
      destination,
      amount,
      description: req.description?.trim() || 'Transfer',
      idempotencyKey: req.idempotencyKey ?? null,
    });

    if (outcome.status === 'insufficient_funds') {
      return { success: false, message: 'Insufficient funds' };
    }
    if (outcome.status === 'duplicate') {
      return { success: false, message: 'Duplicate transfer request' };
    }

    return {
      success: true,
      message: 'Transfer completed',
      sourceBalance: outcome.sourceBalance,
      destinationBalance: outcome.destinationBalance,
    };
  }

  private async resolveDestination(
    req: TransferRequest,
    sourceAccountType: 'checking' | 'savings' | null,
  ): Promise<{ party: TransferParty } | { error: string }> {
    // Virement par identifiant de compte (interne).
    if (req.destinationAccountId) {
      const bank: Account | null = await this.accountRepo.findById(req.destinationAccountId);
      if (bank) {
        if (bank.userId !== req.userId) {
          return { error: 'Destination not owned by user' };
        }
        return { party: { kind: 'bank', id: bank.id } };
      }
      const investment: InvestmentAccount | null = await this.investmentRepo.findById(
        req.destinationAccountId,
      );
      if (!investment || investment.userId !== req.userId) {
        return { error: 'Destination account not found' };
      }
      return { party: { kind: 'investment', id: investment.id } };
    }

    // Virement par IBAN (externe) : réservé aux comptes courants.
    if (req.destinationIban) {
      if (req.sourceType !== 'bank') {
        return { error: 'Investment account cannot transfer to external IBAN' };
      }
      if (sourceAccountType !== 'checking') {
        return { error: 'Only checking can transfer to external IBAN' };
      }
      const dest = await this.accountRepo.findByIban(req.destinationIban);
      if (!dest) {
        return { error: 'Recipient IBAN not found' };
      }
      return { party: { kind: 'bank', id: dest.id } };
    }

    return { error: 'Missing destination' };
  }
}
