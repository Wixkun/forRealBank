import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BeneficiaryEntity,
  NotificationEntity,
  NotificationRepository,
  UserEntity,
} from '@forreal/infrastructure-typeorm';
import { NewsStatus, NotificationType, NotificationTargetType } from '@forreal/domain';
import { NewsService } from '../feed/news.service';
import { isValidIban, normalizeIban } from './iban';

export interface BeneficiaryDTO {
  id: string;
  label: string;
  iban: string;
  createdAt: string;
}

const POSTGRES_UNIQUE_VIOLATION = '23505';

/**
 * Bénéficiaires de virement de l'utilisateur connecté. Le périmètre est
 * appliqué ici : toutes les requêtes sont filtrées par userId (jamais fourni
 * par le client). Après un ajout réussi, une news privée + une notification
 * sont créées pour l'utilisateur — même patron de robustesse que les
 * virements : leur échec est journalisé mais ne casse pas l'ajout.
 */
@Injectable()
export class BeneficiariesService {
  private readonly logger = new Logger(BeneficiariesService.name);

  constructor(
    @InjectRepository(BeneficiaryEntity)
    private readonly beneficiaries: Repository<BeneficiaryEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @Inject(NewsService)
    private readonly newsService: NewsService,
  ) {}

  async listByUser(userId: string): Promise<BeneficiaryDTO[]> {
    const rows = await this.beneficiaries.find({
      where: { userId },
      order: { label: 'ASC', createdAt: 'ASC' },
    });
    return rows.map((b) => this.toDTO(b));
  }

  async create(userId: string, label: string, rawIban: string): Promise<BeneficiaryDTO> {
    const iban = normalizeIban(rawIban);
    if (!isValidIban(iban)) {
      throw new BadRequestException('INVALID_IBAN');
    }

    const existing = await this.beneficiaries.findOne({ where: { userId, iban } });
    if (existing) {
      throw new ConflictException('BENEFICIARY_ALREADY_EXISTS');
    }

    let saved: BeneficiaryEntity;
    try {
      saved = await this.beneficiaries.save(this.beneficiaries.create({ userId, label, iban }));
    } catch (err) {
      // Course entre deux requêtes simultanées : la contrainte UNIQUE
      // (user_id, iban) reste la source de vérité.
      if ((err as { code?: string })?.code === POSTGRES_UNIQUE_VIOLATION) {
        throw new ConflictException('BENEFICIARY_ALREADY_EXISTS');
      }
      throw err;
    }

    await this.notifyBeneficiaryAdded(userId, saved);
    return this.toDTO(saved);
  }

  // Modification du libellé uniquement (l'IBAN est immuable). Le filtre
  // userId garantit qu'on ne touche jamais au bénéficiaire d'un autre.
  async updateLabel(userId: string, id: string, label: string): Promise<BeneficiaryDTO> {
    const beneficiary = await this.beneficiaries.findOne({ where: { id, userId } });
    if (!beneficiary) throw new NotFoundException('BENEFICIARY_NOT_FOUND');

    beneficiary.label = label;
    const saved = await this.beneficiaries.save(beneficiary);
    return this.toDTO(saved);
  }

  async delete(userId: string, id: string): Promise<void> {
    const result = await this.beneficiaries.delete({ id, userId });
    if (!result.affected) throw new NotFoundException('BENEFICIARY_NOT_FOUND');
  }

  // News privée (flux temps réel SSE existant) + notification persistée
  // ciblant la news — mêmes conventions que les notifications de virement.
  private async notifyBeneficiaryAdded(userId: string, b: BeneficiaryEntity): Promise<void> {
    try {
      const news = await this.newsService.createAutomaticNews({
        targetUserId: userId,
        title: 'Nouveau bénéficiaire ajouté',
        subtitle: b.label,
        content: `Le bénéficiaire ${b.label} a été ajouté à votre liste de bénéficiaires.`,
        status: NewsStatus.ACCOUNT,
        metadata: {
          kind: 'BENEFICIARY_ADDED',
          beneficiaryId: b.id,
          beneficiaryLabel: b.label,
          beneficiaryIban: b.iban,
          link: '/dashboard/transfer',
        },
      });

      const notifications = new NotificationRepository(this.notificationRepo, this.userRepo);
      await notifications.create({
        userId,
        title: 'Nouveau bénéficiaire',
        content: `Le bénéficiaire ${b.label} a bien été ajouté.`,
        type: NotificationType.ACCOUNT,
        targetType: NotificationTargetType.NEWS,
        targetId: news.id,
        targetUrl: `/dashboard?newsId=${news.id}`,
      });
    } catch (err) {
      this.logger.warn(
        `beneficiary news/notification failed for user ${userId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private toDTO(b: BeneficiaryEntity): BeneficiaryDTO {
    return {
      id: b.id,
      label: b.label,
      iban: b.iban,
      createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt),
    };
  }
}
