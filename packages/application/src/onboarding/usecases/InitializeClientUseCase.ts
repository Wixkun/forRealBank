import {
  IAccountRepository,
  IAdvisorClientRepository,
  ICardRepository,
  IInvestmentRepository,
  IUserRepository,
  RoleName,
} from '@forreal/domain';
import { pickLeastLoadedId } from '../../common/pickLeastLoaded';

export interface InitializeClientResult {
  initialized: boolean;
  skippedReason?: 'NOT_CLIENT';
  createdAccounts: Array<'CHECKING' | 'SAVINGS' | 'INVESTMENT'>;
  cardCreated: boolean;
  advisorId: string | null;
  advisorAssigned: boolean;
}

// Mêmes valeurs métier que les comptes existants (seed) : épargne rémunérée à
// 2,50 %, carte virtuelle valable 3 ans sur le compte courant.
const SAVINGS_INTEREST_RATE = 2.5;
const CARD_VALIDITY_YEARS = 3;
const CHECKING_NAME = 'Compte Courant';
const SAVINGS_NAME = 'Compte Épargne';
const INVESTMENT_NAME = 'Compte Investissement';

// Borne haute explicite (le list() du repository limite à 20 par défaut).
const MAX_ADVISORS = 500;

/**
 * Initialisation d'un nouveau client à la validation de son inscription :
 *  1. ouverture des trois comptes (CHECKING, SAVINGS, INVESTMENT) ;
 *  2. création d'une carte virtuelle rattachée au seul compte CHECKING ;
 *  3. attribution automatique du conseiller le moins chargé (aléatoire en cas
 *     d'égalité), persistée dans advisor_clients (messagerie immédiatement
 *     fonctionnelle).
 *
 * Le processus est IDEMPOTENT : chaque étape vérifie l'existant avant de
 * créer, donc un double appel ne produit aucun doublon et un appel après un
 * échec partiel complète uniquement ce qui manque (pas d'état incohérent
 * durable). L'absence d'advisor disponible n'échoue pas l'initialisation des
 * comptes : elle est signalée dans le résultat.
 */
export class InitializeClientUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly investmentRepository: IInvestmentRepository,
    private readonly cardRepository: ICardRepository,
    private readonly advisorClientRepository: IAdvisorClientRepository,
    // Injectable pour des tests déterministes (choix aléatoire à égalité).
    private readonly random: () => number = Math.random,
  ) {}

  async execute(input: { userId: string }): Promise<InitializeClientResult> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const emptyResult: InitializeClientResult = {
      initialized: false,
      createdAccounts: [],
      cardCreated: false,
      advisorId: null,
      advisorAssigned: false,
    };

    // Seuls les clients reçoivent l'initialisation bancaire automatique.
    if (!user.roles?.has(RoleName.CLIENT)) {
      return { ...emptyResult, skippedReason: 'NOT_CLIENT' };
    }

    const createdAccounts: InitializeClientResult['createdAccounts'] = [];

    // ── 1. Comptes bancaires (idempotent : on ne crée que ce qui manque) ────
    const existingAccounts = await this.accountRepository.listByUser(input.userId);

    let checking = existingAccounts.find((a) => a.accountType === 'checking') ?? null;
    if (!checking) {
      const cardDigits = this.randomDigits(4);
      checking = await this.createBankAccount(input.userId, {
        name: CHECKING_NAME,
        accountType: 'checking',
        accountNumber: `****${cardDigits}`,
        interestRate: null,
      });
      createdAccounts.push('CHECKING');
    }

    if (!existingAccounts.some((a) => a.accountType === 'savings')) {
      await this.createBankAccount(input.userId, {
        name: SAVINGS_NAME,
        accountType: 'savings',
        accountNumber: `****${this.randomDigits(4)}`,
        interestRate: SAVINGS_INTEREST_RATE,
      });
      createdAccounts.push('SAVINGS');
    }

    const existingInvestments = await this.investmentRepository.listByUser(input.userId);
    if (existingInvestments.length === 0) {
      await this.investmentRepository.create({ userId: input.userId, name: INVESTMENT_NAME });
      createdAccounts.push('INVESTMENT');
    }

    // ── 2. Carte : une seule, rattachée au CHECKING uniquement ──────────────
    let cardCreated = false;
    const existingCards = await this.cardRepository.findByAccountId(checking.id);
    if (existingCards.length === 0) {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + CARD_VALIDITY_YEARS);
      // Le numéro de compte courant reprend les 4 derniers chiffres de la
      // carte (même convention que les comptes existants).
      const lastFour = checking.accountNumber.replace(/\D/g, '').slice(-4) || this.randomDigits(4);
      await this.cardRepository.create({
        accountId: checking.id,
        type: 'virtual',
        lastFour,
        expiryDate,
      });
      cardCreated = true;
    }

    // ── 3. Attribution du conseiller le moins chargé ─────────────────────────
    const { advisorId, advisorAssigned } = await this.assignAdvisor(input.userId);

    return { initialized: true, createdAccounts, cardCreated, advisorId, advisorAssigned };
  }

  private async assignAdvisor(
    clientId: string,
  ): Promise<{ advisorId: string | null; advisorAssigned: boolean }> {
    // Idempotence : un client déjà rattaché garde son conseiller.
    const existing = await this.advisorClientRepository.findAdvisorOf(clientId);
    if (existing) return { advisorId: existing.advisorId, advisorAssigned: false };

    // Advisors actifs (non bannis) pouvant recevoir des clients.
    const users = await this.userRepository.list({ limit: MAX_ADVISORS });
    const advisors = users.filter((u) => u.roles?.has(RoleName.ADVISOR) && !u.isBanned);
    if (advisors.length === 0) {
      // Comportement propre : les comptes restent créés, l'attribution est
      // simplement signalée comme absente (rattrapable au prochain appel).
      return { advisorId: null, advisorAssigned: false };
    }

    // Le moins chargé ; en cas d'égalité, choix aléatoire parmi les ex æquo.
    const counts = await this.advisorClientRepository.countByAdvisorIds(advisors.map((a) => a.id));
    const chosenId = pickLeastLoadedId(
      advisors.map((a) => ({ id: a.id, count: counts[a.id] ?? 0 })),
      this.random,
    );
    if (!chosenId) return { advisorId: null, advisorAssigned: false };

    try {
      await this.advisorClientRepository.link(chosenId, clientId);
      return { advisorId: chosenId, advisorAssigned: true };
    } catch {
      // Course avec un autre appel : l'index unique sur client_id a tranché,
      // on relit le lien gagnant plutôt que d'échouer.
      const winner = await this.advisorClientRepository.findAdvisorOf(clientId);
      return { advisorId: winner?.advisorId ?? null, advisorAssigned: false };
    }
  }

  private async createBankAccount(
    userId: string,
    params: {
      name: string;
      accountType: 'checking' | 'savings';
      accountNumber: string;
      interestRate: number | null;
    },
  ) {
    // L'IBAN est unique en base : en cas de collision (improbable), on
    // retente avec un nouveau tirage plutôt que d'échouer l'initialisation.
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.accountRepository.create({
          userId,
          name: params.name,
          accountType: params.accountType,
          iban: this.generateIban(),
          accountNumber: params.accountNumber,
          interestRate: params.interestRate,
        });
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('ACCOUNT_CREATION_FAILED');
  }

  /** IBAN au format des comptes existants : FR76 + 23 chiffres groupés par 4. */
  private generateIban(): string {
    const digits = this.randomDigits(23);
    const groups = digits.match(/.{1,4}/g) ?? [];
    return `FR76 ${groups.join(' ')}`;
  }

  private randomDigits(count: number): string {
    let out = '';
    for (let i = 0; i < count; i++) out += Math.floor(this.random() * 10);
    return out;
  }
}
