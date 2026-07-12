import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ConversationType,
  IConversationParticipantRepository,
  IConversationRepository,
  IConversationUserStateRepository,
  IUserRepository,
  NotificationType,
  RoleName,
} from '@forreal/domain';
import {
  BanRequestEntity,
  NotificationEntity,
  NotificationRepository,
  UserEntity,
} from '@forreal/infrastructure-typeorm';
import {
  BanUserUseCase,
  EnsureConversationMemberUseCase,
  SendMessageUseCase,
  pickLeastLoadedId,
} from '@forreal/application';
import { ChatGateway } from '../chat/chat.gateway';

export interface BanRequestAttachment {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

const MAX_REASON_LENGTH = 2000;
const MAX_ATTACHMENTS = 5;
// Seules les pièces déjà validées et stockées par /chat/uploads sont admises
// (jamais d'URL externe injectée dans le message).
const CHAT_FILE_URL = /^\/api\/chat\/files\/[0-9a-f-]{36}$/i;

// Verrou advisory Postgres : sérialise l'attribution des demandes pour que
// des créations simultanées ne choisissent pas toutes le même director.
const ASSIGN_LOCK_KEY = 'ban_request_assign';

/**
 * Demandes de bannissement (advisor → director). L'objet métier est la table
 * ban_requests ; le message de conversation n'est qu'un affichage, toutes les
 * décisions passent par l'identifiant de la demande.
 */
@Injectable()
export class BanRequestsService {
  private readonly logger = new Logger(BanRequestsService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(BanRequestEntity)
    private readonly banRequests: Repository<BanRequestEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationEntities: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntities: Repository<UserEntity>,
    @Inject(IUserRepository) private readonly users: IUserRepository,
    @Inject(IConversationRepository)
    private readonly conversations: IConversationRepository,
    @Inject(IConversationParticipantRepository)
    private readonly participants: IConversationParticipantRepository,
    @Inject(IConversationUserStateRepository)
    private readonly conversationStates: IConversationUserStateRepository,
    @Inject(SendMessageUseCase) private readonly sendMessage: SendMessageUseCase,
    @Inject(EnsureConversationMemberUseCase)
    private readonly ensureMember: EnsureConversationMemberUseCase,
    @Inject(BanUserUseCase) private readonly banUser: BanUserUseCase,
    @Inject(ChatGateway) private readonly chatGateway: ChatGateway,
  ) {}

  // ─── Création ──────────────────────────────────────────────────────────────

  async create(params: {
    advisorId: string;
    clientId: string;
    reason: string;
    attachments: BanRequestAttachment[];
  }) {
    const reason = (params.reason ?? '').trim();
    if (!reason) throw new BadRequestException('REASON_REQUIRED');
    if (reason.length > MAX_REASON_LENGTH) throw new BadRequestException('REASON_TOO_LONG');

    const attachments = params.attachments ?? [];
    if (attachments.length > MAX_ATTACHMENTS) {
      throw new BadRequestException('TOO_MANY_ATTACHMENTS');
    }
    for (const file of attachments) {
      if (!CHAT_FILE_URL.test(file.url)) {
        throw new BadRequestException('INVALID_ATTACHMENT');
      }
    }

    // La demande ne peut viser qu'un de SES clients, non banni.
    const link: Array<{ id: string }> = await this.dataSource.query(
      `SELECT id FROM advisor_clients WHERE advisor_id = $1 AND client_id = $2`,
      [params.advisorId, params.clientId],
    );
    if (link.length === 0) {
      throw new ForbiddenException('CLIENT_NOT_ASSIGNED_TO_YOU');
    }
    const client = await this.users.findById(params.clientId);
    if (!client) throw new NotFoundException('CLIENT_NOT_FOUND');
    if (client.isBanned) throw new ConflictException('CLIENT_ALREADY_BANNED');

    const existingPending = await this.banRequests.count({
      where: { clientId: params.clientId, advisorRequesterId: params.advisorId, status: 'PENDING' },
    });
    if (existingPending > 0) throw new ConflictException('BAN_REQUEST_ALREADY_PENDING');

    const advisor = await this.users.findById(params.advisorId);
    if (!advisor) throw new NotFoundException('ADVISOR_NOT_FOUND');

    // Attribution au director avec le moins de demandes PENDING (aléatoire en
    // cas d'égalité), sous verrou advisory pour les créations concurrentes.
    const directorId = await this.pickAssignedDirector();
    if (!directorId) throw new ConflictException('NO_DIRECTOR_AVAILABLE');

    // Conversation privée advisor ↔ director : réutilisée si elle existe
    // (et démasquée), créée sinon. Déduplication par identifiants.
    const conversationId = await this.openConversation(params.advisorId, directorId);

    // Message structuré (affichage) + marqueurs de pièces jointes au format
    // standard de la messagerie. Les actions s'appuient sur banRequestId.
    const advisorName = `${advisor.firstName} ${advisor.lastName}`.trim();
    const clientName = `${client.firstName} ${client.lastName}`.trim();
    const markers = attachments.map((file) =>
      file.mimeType.startsWith('image/')
        ? `![image](${file.url})`
        : `![file|${encodeURIComponent(file.name)}|${file.size}](${file.url})`,
    );
    const content = [
      `Demande de bannissement`,
      ``,
      `Client concerné : ${clientName}`,
      `Advisor demandeur : ${advisorName}`,
      `Motif : ${reason}`,
      `Date : ${new Date().toLocaleDateString('fr-FR')}`,
      ...markers,
    ].join('\n');

    const message = await this.sendMessage.execute({
      conversationId,
      senderId: params.advisorId,
      content,
    });

    const saved = await this.banRequests.save(
      this.banRequests.create({
        clientId: params.clientId,
        advisorRequesterId: params.advisorId,
        assignedDirectorId: directorId,
        reason,
        status: 'PENDING',
        conversationId,
        messageId: message.messageId,
      }),
    );

    // Rafraîchit la liste de conversations du director connecté.
    this.chatGateway.notifyUsers([directorId], 'conversation_created', { conversationId });

    return {
      id: saved.id,
      assignedDirectorId: directorId,
      conversationId,
      messageId: message.messageId,
      status: saved.status,
    };
  }

  // ─── Lecture (rendu des cartes dans la conversation) ───────────────────────

  async listByConversation(conversationId: string, viewerId: string) {
    const isMember = await this.ensureMember.isMember({ conversationId, userId: viewerId });
    if (!isMember) throw new ForbiddenException('Not a participant of this conversation');

    const requests = await this.banRequests.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
    if (requests.length === 0) return [];

    const userIds = Array.from(
      new Set(requests.flatMap((r) => [r.clientId, r.advisorRequesterId])),
    );
    const usersById = new Map(
      (await this.users.findByIds(userIds)).map((u) => [
        u.id,
        `${u.firstName} ${u.lastName}`.trim(),
      ]),
    );

    return requests.map((request) => ({
      id: request.id,
      messageId: request.messageId,
      status: request.status,
      clientId: request.clientId,
      clientName: usersById.get(request.clientId) ?? '',
      advisorName: usersById.get(request.advisorRequesterId) ?? '',
      reason: request.reason,
      decisionComment: request.decisionComment,
      processedAt: request.processedAt?.toISOString() ?? null,
      createdAt: request.createdAt?.toISOString() ?? null,
      // Seul le director ASSIGNÉ voit et utilise les boutons, uniquement
      // tant que la demande est en attente.
      canDecide: request.assignedDirectorId === viewerId && request.status === 'PENDING',
    }));
  }

  // ─── Décision ──────────────────────────────────────────────────────────────

  async decide(params: {
    requestId: string;
    actorId: string;
    accept: boolean;
    comment?: string | null;
  }) {
    const status = params.accept ? 'ACCEPTED' : 'REJECTED';
    const comment = (params.comment ?? '').trim() || null;

    // Revendication ATOMIQUE : seule la première décision du director assigné
    // sur une demande encore PENDING passe ; toute autre tentative échoue.
    const claimed: Array<{
      client_id: string;
      advisor_requester_id: string;
      conversation_id: string | null;
    }> = await this.dataSource.query(
      `UPDATE ban_requests
       SET status = $1, decision_comment = $2, processed_at = now(),
           processed_by_id = $3, updated_at = now()
       WHERE id = $4 AND status = 'PENDING' AND assigned_director_id = $3
       RETURNING client_id, advisor_requester_id, conversation_id`,
      [status, comment, params.actorId, params.requestId],
    );
    const row = Array.isArray(claimed[0]) ? claimed[0][0] : claimed[0];
    if (!row) {
      const existing = await this.banRequests.findOne({ where: { id: params.requestId } });
      if (!existing) throw new NotFoundException('BAN_REQUEST_NOT_FOUND');
      if (existing.status !== 'PENDING') throw new ConflictException('ALREADY_PROCESSED');
      throw new ForbiddenException('NOT_ASSIGNED_DIRECTOR');
    }

    if (params.accept) {
      try {
        await this.banUser.execute({
          targetUserId: row.client_id,
          reason: 'BAN_REQUEST_ACCEPTED',
        });
        // Invalidation immédiate des sessions temps réel sur tout le cluster.
        this.chatGateway.disconnectUser(row.client_id);
      } catch (error) {
        // Le bannissement a échoué : on rend la demande à nouveau décidable
        // plutôt que de laisser un état « acceptée mais non appliquée ».
        await this.banRequests.update(
          { id: params.requestId },
          { status: 'PENDING', processedAt: null, processedById: null, decisionComment: null },
        );
        throw error;
      }
    }

    // Information de l'advisor demandeur (best-effort).
    try {
      const notifications = new NotificationRepository(
        this.notificationEntities,
        this.userEntities,
      );
      const client = await this.users.findById(row.client_id);
      const clientName = client ? `${client.firstName} ${client.lastName}`.trim() : 'Client';
      await notifications.create({
        userId: row.advisor_requester_id,
        title: params.accept
          ? 'Demande de bannissement acceptée'
          : 'Demande de bannissement refusée',
        content: params.accept
          ? `Votre demande concernant ${clientName} a été acceptée. Le client est banni.`
          : `Votre demande concernant ${clientName} a été refusée.${comment ? ` Commentaire : ${comment}` : ''}`,
        type: NotificationType.SYSTEM,
        targetType: null,
        targetId: null,
        targetUrl: row.conversation_id
          ? `/dashboard/messages?conversationId=${row.conversation_id}`
          : null,
        groupKey: null,
      });
    } catch (error) {
      this.logger.error(
        `Ban request decision notification failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return { success: true, status };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async pickAssignedDirector(): Promise<string | null> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [ASSIGN_LOCK_KEY]);

      // Directors actifs (non bannis) + nombre de demandes PENDING chacun.
      const rows: Array<{ id: string; pending: string }> = await manager.query(
        `SELECT u.id, COUNT(br.id) FILTER (WHERE br.status = 'PENDING') AS pending
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id AND r.name = $1
         LEFT JOIN ban_requests br ON br.assigned_director_id = u.id
         WHERE u.is_banned = false
         GROUP BY u.id`,
        [RoleName.DIRECTOR],
      );
      return pickLeastLoadedId(rows.map((r) => ({ id: r.id, count: Number(r.pending) })));
    });
  }

  /** Réutilise (et démasque) la conversation privée existante, sinon la crée. */
  private async openConversation(advisorId: string, directorId: string): Promise<string> {
    const existing = await this.conversations.findPrivateBetween(advisorId, directorId);
    if (existing) {
      await this.conversationStates.setHidden(advisorId, existing.id, false);
      await this.conversationStates.setHidden(directorId, existing.id, false);
      return existing.id;
    }
    const created = await this.conversations.create(ConversationType.PRIVATE);
    await this.participants.addParticipantIfNotExists(created.id, advisorId);
    await this.participants.addParticipantIfNotExists(created.id, directorId);
    return created.id;
  }
}
