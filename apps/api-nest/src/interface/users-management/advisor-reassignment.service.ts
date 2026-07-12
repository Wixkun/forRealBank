import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IAdvisorClientRepository,
  IConversationRepository,
  IConversationUserStateRepository,
  IUserRepository,
  NotificationTargetType,
  NotificationType,
  NewsStatus,
  RoleName,
  User,
} from '@forreal/domain';
import {
  NotificationEntity,
  NotificationRepository,
  UserEntity,
} from '@forreal/infrastructure-typeorm';
import { NewsService } from '../feed/news.service';
import { ChatGateway } from '../chat/chat.gateway';

function fullName(user: User): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

/**
 * Réattribution d'un client à un autre advisor (DIRECTOR/ADMIN uniquement).
 * Le cœur (retrait + attribution + audit) est ATOMIQUE (replaceAdvisor,
 * transaction SQL). Les effets annexes sont best-effort et journalisés :
 *  - masquage de l'ancienne conversation privée pour les DEUX participants
 *    (elle est de plus gelée par CanUseConversationUseCase : plus d'envoi ni
 *    de réouverture possible tant que la relation n'existe plus) ;
 *  - notifications ciblées (client, nouvel advisor, ancien advisor) ;
 *  - news privées ciblées avec action (client → contacter le nouvel advisor ;
 *    nouvel advisor → consulter la fiche du client).
 * La conversation avec le nouvel advisor n'est PAS créée automatiquement.
 */
@Injectable()
export class AdvisorReassignmentService {
  private readonly logger = new Logger(AdvisorReassignmentService.name);

  constructor(
    @Inject(IAdvisorClientRepository)
    private readonly advisorClients: IAdvisorClientRepository,
    @Inject(IUserRepository) private readonly users: IUserRepository,
    @Inject(IConversationRepository)
    private readonly conversations: IConversationRepository,
    @Inject(IConversationUserStateRepository)
    private readonly conversationStates: IConversationUserStateRepository,
    @InjectRepository(NotificationEntity)
    private readonly notificationEntities: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntities: Repository<UserEntity>,
    @Inject(NewsService) private readonly newsService: NewsService,
    @Inject(ChatGateway) private readonly chatGateway: ChatGateway,
  ) {}

  async reassign(params: { actorId: string; clientId: string; newAdvisorId: string }) {
    const [client, newAdvisor] = await Promise.all([
      this.users.findById(params.clientId),
      this.users.findById(params.newAdvisorId),
    ]);

    if (!client || !client.roles?.has(RoleName.CLIENT)) {
      throw new NotFoundException('CLIENT_NOT_FOUND');
    }
    if (!newAdvisor || !newAdvisor.roles?.has(RoleName.ADVISOR)) {
      throw new BadRequestException('TARGET_NOT_ADVISOR');
    }
    // Un client ne peut jamais être attribué à un advisor banni.
    if (newAdvisor.isBanned) {
      throw new ForbiddenException('ADVISOR_BANNED');
    }

    // Atomique : retrait de l'ancien lien + nouveau lien + ligne d'audit.
    let oldAdvisorId: string | null;
    try {
      const result = await this.advisorClients.replaceAdvisor({
        clientId: params.clientId,
        newAdvisorId: params.newAdvisorId,
        changedBy: params.actorId,
      });
      oldAdvisorId = result.oldAdvisorId;
    } catch (error) {
      if (error instanceof Error && error.message === 'ADVISOR_UNCHANGED') {
        throw new BadRequestException('ADVISOR_UNCHANGED');
      }
      throw error;
    }

    // Effets annexes : ne doivent jamais annuler la réattribution déjà commise.
    try {
      await this.applySideEffects(client, newAdvisor, oldAdvisorId);
    } catch (error) {
      this.logger.error(
        `Reassignment side effects failed for client ${client.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return { success: true, oldAdvisorId, newAdvisorId: params.newAdvisorId };
  }

  private async applySideEffects(
    client: User,
    newAdvisor: User,
    oldAdvisorId: string | null,
  ): Promise<void> {
    const notifications = new NotificationRepository(this.notificationEntities, this.userEntities);
    const clientName = fullName(client);
    const advisorName = fullName(newAdvisor);

    // 1. Ancienne conversation privée : masquée pour les DEUX participants
    //    (conservée en base avec tout son historique ; gelée par ailleurs).
    if (oldAdvisorId) {
      const oldConversation = await this.conversations.findPrivateBetween(client.id, oldAdvisorId);
      if (oldConversation) {
        await this.conversationStates.setHidden(client.id, oldConversation.id, true);
        await this.conversationStates.setHidden(oldAdvisorId, oldConversation.id, true);
      }
    }

    // 2. News privée ciblée du client, avec action « Contacter mon nouvel
    //    advisor » (metadata exploitée par la popup de news).
    const clientNews = await this.newsService.createAutomaticNews({
      targetUserId: client.id,
      title: 'Votre conseiller a changé',
      subtitle: `Votre nouveau conseiller est ${advisorName}`,
      content: `Votre nouveau conseiller est ${advisorName}. Vous pouvez le contacter dès maintenant depuis la messagerie.`,
      status: NewsStatus.INFORMATION,
      metadata: { kind: 'ADVISOR_CHANGED', advisorId: newAdvisor.id, advisorName },
    });
    await notifications.create({
      userId: client.id,
      title: 'Votre conseiller a changé',
      content: `Votre nouveau conseiller est ${advisorName}.`,
      type: NotificationType.SYSTEM,
      targetType: NotificationTargetType.NEWS,
      targetId: clientNews.id,
      targetUrl: `/dashboard?newsId=${clientNews.id}`,
      groupKey: null,
    });

    // 3. News + notification ciblées du NOUVEL advisor, avec action
    //    « Consulter le client » (ouvre sa fiche dans la page Utilisateurs).
    const advisorNews = await this.newsService.createAutomaticNews({
      targetUserId: newAdvisor.id,
      title: 'Nouveau client attribué',
      subtitle: `${clientName} vous a été attribué`,
      content: `Le client ${clientName} vous a été attribué. Vous pouvez consulter sa fiche depuis la page Utilisateurs.`,
      status: NewsStatus.INFORMATION,
      metadata: { kind: 'CLIENT_ASSIGNED', clientId: client.id, clientName },
    });
    await notifications.create({
      userId: newAdvisor.id,
      title: 'Nouveau client attribué',
      content: `Le client ${clientName} vous a été attribué.`,
      type: NotificationType.SYSTEM,
      targetType: NotificationTargetType.NEWS,
      targetId: advisorNews.id,
      targetUrl: `/dashboard?newsId=${advisorNews.id}`,
      groupKey: null,
    });

    // 4. Notification simple de l'ANCIEN advisor (le client disparaît de sa
    //    liste au prochain chargement — le périmètre est recalculé serveur).
    if (oldAdvisorId) {
      await notifications.create({
        userId: oldAdvisorId,
        title: 'Client réattribué',
        content: `Le client ${clientName} ne vous est plus attribué.`,
        type: NotificationType.SYSTEM,
        targetType: null,
        targetId: null,
        targetUrl: null,
        groupKey: null,
      });
    }

    // 5. Rafraîchissement temps réel des listes de conversations des
    //    participants connectés (l'ancienne conversation vient d'être masquée).
    const affected = [client.id, newAdvisor.id, ...(oldAdvisorId ? [oldAdvisorId] : [])];
    this.chatGateway.notifyUsers(affected, 'conversation_created', {});
  }
}
