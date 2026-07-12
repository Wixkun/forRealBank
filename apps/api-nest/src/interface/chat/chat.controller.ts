import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Inject,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
  Res,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request as ExpressRequest, Response } from 'express';
import type { Request } from 'express';
import { ChatFilesService } from './chat-files.service';
import { ConversationType, IConversationRepository } from '@forreal/domain';
import { RoleName } from '@forreal/domain';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ChatGateway } from './chat.gateway';
import { SendMessageUseCase } from '@forreal/application';
import { ListMessagesUseCase } from '@forreal/application';
import { MarkMessageReadUseCase } from '@forreal/application';
import { LinkAdvisorClientUseCase } from '@forreal/application';
import { ListConversationsByUserUseCase } from '@forreal/application';
import { ListParticipantsDetailsByConversationUseCase } from '@forreal/application';
import { ListClientsOfAdvisorUseCase } from '@forreal/application';
import { FindAdvisorOfClientUseCase } from '@forreal/application';
import { SetConversationMuteUseCase } from '@forreal/application';
import { GetConversationNotificationSettingsUseCase } from '@forreal/application';
import { UpdateConversationUserStateUseCase } from '@forreal/application';
import { EnsureConversationMemberUseCase } from '@forreal/application';
import { CreateGroupConversationUseCase } from '@forreal/application';
import { SetConversationHiddenUseCase } from '@forreal/application';
import { ListContactableUsersUseCase } from '@forreal/application';
import { OpenPrivateConversationUseCase } from '@forreal/application';
import { CanUseConversationUseCase } from '@forreal/application';
import {
  SendMessageDto,
  LinkAdvisorClientDto,
  UpdateConversationStateDto,
  MuteConversationDto,
  CreateGroupDto,
  OpenPrivateConversationDto,
} from './dto/chat.dto';

const CHAT_FILE_MIME_TYPES = /^(image\/(jpeg|png|gif|webp)|application\/pdf)$/;
const MAX_CHAT_FILE_BYTES = 10 * 1024 * 1024;
const MAX_CHAT_FILES = 5;

// Pièces jointes de messagerie (images + PDF). Stockage en mémoire puis en
// base : en cluster (replicas sans volume partagé), le disque local d'une
// instance n'est pas visible des autres.
const chatFilesInterceptor = FilesInterceptor('files', MAX_CHAT_FILES, {
  storage: memoryStorage(),
  limits: { fileSize: MAX_CHAT_FILE_BYTES },
  fileFilter: (
    _req: ExpressRequest,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!CHAT_FILE_MIME_TYPES.test(file.mimetype)) {
      cb(new BadRequestException('INVALID_FILE_TYPE'), false);
      return;
    }
    cb(null, true);
  },
});

function extractUserId(req: Request): string {
  const userId = (req as any).auth?.userId ?? (req as any).user?.id ?? null;
  if (!userId) throw new BadRequestException('Missing auth context');
  return userId as string;
}

// Rôles vérifiés côté serveur (peuplés par RolesGuard), jamais issus du client.
function extractRoles(req: Request): RoleName[] {
  return ((req as any).auth?.roles ?? []) as RoleName[];
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    @Inject(ChatFilesService) private readonly chatFilesService: ChatFilesService,
    @Inject(SendMessageUseCase) private readonly sendMessageUseCase: SendMessageUseCase,
    @Inject(ListMessagesUseCase) private readonly listMessagesUseCase: ListMessagesUseCase,
    @Inject(MarkMessageReadUseCase) private readonly markMessageReadUseCase: MarkMessageReadUseCase,
    @Inject(LinkAdvisorClientUseCase)
    private readonly linkAdvisorClientUseCase: LinkAdvisorClientUseCase,
    @Inject(ListConversationsByUserUseCase)
    private readonly listConversationsByUserUseCase: ListConversationsByUserUseCase,
    @Inject(ListParticipantsDetailsByConversationUseCase)
    private readonly listParticipantsDetails: ListParticipantsDetailsByConversationUseCase,
    @Inject(ListClientsOfAdvisorUseCase)
    private readonly listClientsOfAdvisor: ListClientsOfAdvisorUseCase,
    @Inject(FindAdvisorOfClientUseCase)
    private readonly findAdvisorOfClient: FindAdvisorOfClientUseCase,
    @Inject(SetConversationHiddenUseCase)
    private readonly setConversationHidden: SetConversationHiddenUseCase,
    @Inject(ListContactableUsersUseCase)
    private readonly listContactableUsers: ListContactableUsersUseCase,
    @Inject(OpenPrivateConversationUseCase)
    private readonly openPrivateConversation: OpenPrivateConversationUseCase,
    @Inject(CanUseConversationUseCase)
    private readonly canUseConversation: CanUseConversationUseCase,
    @Inject(SetConversationMuteUseCase)
    private readonly setConversationMuteUC: SetConversationMuteUseCase,
    @Inject(GetConversationNotificationSettingsUseCase)
    private readonly getConversationSettingsUC: GetConversationNotificationSettingsUseCase,
    @Inject(UpdateConversationUserStateUseCase)
    private readonly updateConversationStateUC: UpdateConversationUserStateUseCase,
    @Inject(EnsureConversationMemberUseCase)
    private readonly ensureConversationMember: EnsureConversationMemberUseCase,
    @Inject(CreateGroupConversationUseCase)
    private readonly createGroupUC: CreateGroupConversationUseCase,
    @Inject(IConversationRepository)
    private readonly conversationRepository: IConversationRepository,
    @Inject(ChatGateway)
    private readonly chatGateway: ChatGateway,
  ) {}

  // Autorisation centralisée : l'utilisateur doit être participant de la
  // conversation. Lève 403 sinon. Réutilisée par tous les endpoints ciblant
  // une conversation précise.
  private async assertConversationMember(conversationId: string, userId: string): Promise<void> {
    const isMember = await this.ensureConversationMember.isMember({ conversationId, userId });
    if (!isMember) throw new ForbiddenException('Not a participant of this conversation');
  }

  // Le mute n'est autorisé que sur les conversations de groupe (les
  // conversations privées avec conseiller/directeur restent notifiées).
  private async assertGroupConversation(conversationId: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || conversation.type !== ConversationType.GROUP) {
      throw new ForbiddenException('Only group conversations can be muted');
    }
  }

  // Ouvre (ou rouvre) LA conversation privée avec un interlocuteur autorisé.
  // Remplace l'ancien flux « create + add participants » (qui permettait
  // d'ouvrir une privée avec n'importe qui) : autorisation par les règles
  // métier, déduplication par identifiants et démasquage côté use case.
  @Post('conversations/private/open')
  @UseGuards(RolesGuard)
  async openPrivate(@Body() body: OpenPrivateConversationDto, @Req() req: Request) {
    try {
      const result = await this.openPrivateConversation.execute({
        requesterId: extractUserId(req),
        requesterRoles: extractRoles(req),
        targetUserId: body.targetUserId,
      });
      if (result.created) {
        this.chatGateway.notifyUsers([body.targetUserId], 'conversation_created', {
          conversationId: result.conversationId,
        });
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OPEN_CONVERSATION_FAILED';
      if (message === 'CONTACT_NOT_ALLOWED') throw new ForbiddenException(message);
      throw new BadRequestException(message);
    }
  }

  // Annuaire des interlocuteurs autorisés (filtré par rôle CÔTÉ SERVEUR : un
  // advisor ne voit que ses clients, un client que son conseiller…), avec
  // recherche insensible à la casse sur prénom / nom / nom complet.
  @Get('contacts')
  @UseGuards(RolesGuard)
  async listContacts(@Query('search') search: string | undefined, @Req() req: Request) {
    return this.listContactableUsers.execute({
      requesterId: extractUserId(req),
      requesterRoles: extractRoles(req),
      search,
    });
  }

  // Création d'un groupe : réservée aux rôles métier (contrôle backend par
  // RolesGuard, pas seulement masquage du bouton côté frontend).
  @Post('groups')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADVISOR, RoleName.DIRECTOR, RoleName.ADMIN)
  async createGroup(@Body() body: CreateGroupDto, @Req() req: Request) {
    const creatorId = extractUserId(req);
    // Les rôles proviennent du contexte authentifié peuplé par RolesGuard,
    // jamais du corps de la requête.
    const creatorRoles = ((req as any).auth?.roles ?? []) as RoleName[];
    try {
      const result = await this.createGroupUC.execute({
        creatorId,
        creatorRoles,
        name: body.name,
        participantIds: body.participantIds,
      });
      // Notifie les participants en ligne pour rafraîchir leur liste sans reload.
      this.chatGateway.notifyUsers(result.participantIds, 'conversation_created', {
        conversationId: result.conversationId,
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GROUP_CREATION_FAILED';
      throw new BadRequestException(message);
    }
  }

  // Présence : statut en ligne d'un ensemble d'utilisateurs (état initial /
  // repli du temps réel). La vérité vient des sockets authentifiés du cluster.
  @Get('presence')
  async getPresence(@Query('userIds') userIds?: string): Promise<Record<string, boolean>> {
    const ids = (userIds ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const result: Record<string, boolean> = {};
    for (const id of ids) result[id] = this.chatGateway.isUserOnline(id);
    return result;
  }

  // Administration de la relation conseiller-client : réservée aux rôles
  // habilités (auparavant ouvert à tout utilisateur authentifié).
  @Post('advisor-client')
  @UseGuards(RolesGuard)
  @Roles(RoleName.DIRECTOR, RoleName.ADMIN)
  async linkAdvisor(@Body() body: LinkAdvisorClientDto) {
    return this.linkAdvisorClientUseCase.execute(body);
  }

  @Post('messages')
  async postMessage(@Body() body: SendMessageDto, @Req() req: Request) {
    // Le sender est toujours l'utilisateur authentifié : on n'accepte pas de
    // senderId arbitraire depuis le corps de la requête (usurpation).
    const senderId = extractUserId(req);
    await this.assertConversationMember(body.conversationId, senderId);
    // Conversation gelée (relation advisor-client retirée) : lecture seule.
    if (!(await this.canUseConversation.isWritable(body.conversationId))) {
      throw new ForbiddenException('CONVERSATION_LOCKED');
    }
    return this.sendMessageUseCase.execute({
      conversationId: body.conversationId,
      senderId,
      content: body.content,
    });
  }

  @Post('uploads')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(chatFilesInterceptor)
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Req() req: Request,
  ) {
    const userId = extractUserId(req);
    return this.chatFilesService.saveAll(files ?? [], userId);
  }

  @Get('files/:id')
  @UseGuards(JwtAuthGuard)
  async getFile(@Param('id') id: string, @Res() res: Response) {
    const file = await this.chatFilesService.findById(id);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.data.length),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(file.data);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') conversationId: string,
    @Req() req: Request,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    await this.assertConversationMember(conversationId, extractUserId(req));
    return this.listMessagesUseCase.execute({
      conversationId,
      limit: limit ? +limit : 50,
      offset: offset ? +offset : 0,
    });
  }

  @Post('messages/:id/read')
  async markMessageRead(@Param('id') messageId: string) {
    return this.markMessageReadUseCase.execute({ messageId });
  }

  // Le :userId de l'URL est ignoré au profit de l'utilisateur authentifié :
  // on ne peut lister que SES propres conversations (protection IDOR).
  @Get('conversations/by-user/:userId')
  async listConversationsByUser(@Req() req: Request) {
    return this.listConversationsByUserUseCase.execute({ userId: extractUserId(req) });
  }

  // Un advisor ne peut lister que SES clients ; DIRECTOR/ADMIN peuvent
  // consulter la liste de n'importe quel conseiller.
  @Get('advisor/:advisorId/clients')
  @UseGuards(RolesGuard)
  async listClients(@Param('advisorId') advisorId: string, @Req() req: Request) {
    const roles = extractRoles(req);
    const isPrivileged = roles.includes(RoleName.DIRECTOR) || roles.includes(RoleName.ADMIN);
    if (!isPrivileged && advisorId !== extractUserId(req)) {
      throw new ForbiddenException('Cannot list clients of another advisor');
    }
    return this.listClientsOfAdvisor.execute({ advisorId });
  }

  // Un client ne peut consulter que SON conseiller (ou rôles privilégiés).
  @Get('client/:clientId/advisor')
  @UseGuards(RolesGuard)
  async getAdvisorOfClient(@Param('clientId') clientId: string, @Req() req: Request) {
    const roles = extractRoles(req);
    const isPrivileged = roles.includes(RoleName.DIRECTOR) || roles.includes(RoleName.ADMIN);
    if (!isPrivileged && clientId !== extractUserId(req)) {
      throw new ForbiddenException('Cannot read advisor of another client');
    }
    return this.findAdvisorOfClient.execute({ clientId });
  }

  @Get('conversations/:id/participants')
  async listParticipants(@Param('id') conversationId: string, @Req() req: Request) {
    await this.assertConversationMember(conversationId, extractUserId(req));
    return this.listParticipantsDetails.execute({ conversationId });
  }

  // La conversation accepte-t-elle encore l'écriture ? false = gelée (paire
  // advisor-client dont la relation d'attribution a été retirée) : le front
  // masque le composer, le backend refuse de toute façon l'envoi.
  @Get('conversations/:id/writable')
  async isConversationWritable(@Param('id') conversationId: string, @Req() req: Request) {
    await this.assertConversationMember(conversationId, extractUserId(req));
    return { writable: await this.canUseConversation.isWritable(conversationId) };
  }

  // ─── Notifications de conversation ──────────────────────────────────────────

  @Patch('conversations/:id/notifications/mute')
  @UseGuards(JwtAuthGuard)
  async muteConversation(
    @Param('id') conversationId: string,
    @Body() body: MuteConversationDto,
    @Req() req: Request,
  ) {
    const userId = extractUserId(req);
    await this.assertGroupConversation(conversationId);
    await this.assertConversationMember(conversationId, userId);
    return this.setConversationMuteUC.execute({
      userId,
      conversationId,
      muted: true,
      mutedUntil: body.mutedUntil ? new Date(body.mutedUntil) : null,
    });
  }

  @Patch('conversations/:id/notifications/unmute')
  @UseGuards(JwtAuthGuard)
  async unmuteConversation(@Param('id') conversationId: string, @Req() req: Request) {
    const userId = extractUserId(req);
    await this.assertGroupConversation(conversationId);
    await this.assertConversationMember(conversationId, userId);
    return this.setConversationMuteUC.execute({ userId, conversationId, muted: false });
  }

  @Get('conversations/:id/notifications/settings')
  @UseGuards(JwtAuthGuard)
  async getConversationNotificationSettings(
    @Param('id') conversationId: string,
    @Req() req: Request,
  ) {
    const userId = extractUserId(req);
    await this.assertConversationMember(conversationId, userId);
    return this.getConversationSettingsUC.execute({ userId, conversationId });
  }

  // ─── Masquage (visibilité individuelle, rien n'est supprimé) ─────────────
  // Ne modifie QUE la visibilité de l'utilisateur connecté : l'historique, les
  // autres participants, le mute et l'appartenance au groupe sont intacts. La
  // conversation réapparaît automatiquement au prochain message reçu.

  @Patch('conversations/:id/hide')
  async hideConversation(@Param('id') conversationId: string, @Req() req: Request) {
    const userId = extractUserId(req);
    await this.assertConversationMember(conversationId, userId);
    return this.setConversationHidden.execute({ userId, conversationId, hidden: true });
  }

  @Patch('conversations/:id/unhide')
  async unhideConversation(@Param('id') conversationId: string, @Req() req: Request) {
    const userId = extractUserId(req);
    await this.assertConversationMember(conversationId, userId);
    // Une conversation gelée (relation advisor-client retirée) ne peut pas
    // être rouverte manuellement par l'ancien advisor.
    if (!(await this.canUseConversation.isWritable(conversationId))) {
      throw new ForbiddenException('CONVERSATION_LOCKED');
    }
    return this.setConversationHidden.execute({ userId, conversationId, hidden: false });
  }

  // ─── État de lecture ──────────────────────────────────────────────────────

  @Patch('conversations/:id/state')
  @UseGuards(JwtAuthGuard)
  async updateConversationState(
    @Param('id') conversationId: string,
    @Body() body: UpdateConversationStateDto,
    @Req() req: Request,
  ) {
    const userId = extractUserId(req);
    await this.assertConversationMember(conversationId, userId);
    return this.updateConversationStateUC.execute({
      userId,
      conversationId,
      lastReadMessageId: body.lastReadMessageId,
    });
  }
}
