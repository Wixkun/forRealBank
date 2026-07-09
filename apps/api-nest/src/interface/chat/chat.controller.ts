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
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request as ExpressRequest, Response } from 'express';
import type { Request } from 'express';
import { ChatFilesService } from './chat-files.service';
import { ConversationType } from '@forreal/domain';
import { RoleName } from '@forreal/domain';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateConversationUseCase } from '@forreal/application';
import { SendMessageUseCase } from '@forreal/application';
import { ListMessagesUseCase } from '@forreal/application';
import { MarkMessageReadUseCase } from '@forreal/application';
import { LinkAdvisorClientUseCase } from '@forreal/application';
import { ListConversationsByUserUseCase } from '@forreal/application';
import { ListParticipantsDetailsByConversationUseCase } from '@forreal/application';
import { AddConversationParticipantUseCase } from '@forreal/application';
import { ListClientsOfAdvisorUseCase } from '@forreal/application';
import { FindAdvisorOfClientUseCase } from '@forreal/application';
import { ListUsersByRoleUseCase } from '@forreal/application';
import { SetConversationMuteUseCase } from '@forreal/application';
import { GetConversationNotificationSettingsUseCase } from '@forreal/application';
import { UpdateConversationUserStateUseCase } from '@forreal/application';

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

@Controller('chat')
export class ChatController {
  constructor(
    @Inject(ChatFilesService) private readonly chatFilesService: ChatFilesService,
    @Inject(CreateConversationUseCase)
    private readonly createConversationUseCase: CreateConversationUseCase,
    @Inject(SendMessageUseCase) private readonly sendMessageUseCase: SendMessageUseCase,
    @Inject(ListMessagesUseCase) private readonly listMessagesUseCase: ListMessagesUseCase,
    @Inject(MarkMessageReadUseCase) private readonly markMessageReadUseCase: MarkMessageReadUseCase,
    @Inject(LinkAdvisorClientUseCase)
    private readonly linkAdvisorClientUseCase: LinkAdvisorClientUseCase,
    @Inject(ListConversationsByUserUseCase)
    private readonly listConversationsByUserUseCase: ListConversationsByUserUseCase,
    @Inject(ListParticipantsDetailsByConversationUseCase)
    private readonly listParticipantsDetails: ListParticipantsDetailsByConversationUseCase,
    @Inject(AddConversationParticipantUseCase)
    private readonly addConversationParticipant: AddConversationParticipantUseCase,
    @Inject(ListClientsOfAdvisorUseCase)
    private readonly listClientsOfAdvisor: ListClientsOfAdvisorUseCase,
    @Inject(FindAdvisorOfClientUseCase)
    private readonly findAdvisorOfClient: FindAdvisorOfClientUseCase,
    @Inject(ListUsersByRoleUseCase) private readonly listUsersByRole: ListUsersByRoleUseCase,
    @Inject(SetConversationMuteUseCase)
    private readonly setConversationMuteUC: SetConversationMuteUseCase,
    @Inject(GetConversationNotificationSettingsUseCase)
    private readonly getConversationSettingsUC: GetConversationNotificationSettingsUseCase,
    @Inject(UpdateConversationUserStateUseCase)
    private readonly updateConversationStateUC: UpdateConversationUserStateUseCase,
  ) {}

  @Post('conversations')
  async createConversation(@Body() body: { type: 'PRIVATE' | 'GROUP' }) {
    const type = body.type === 'PRIVATE' ? ConversationType.PRIVATE : ConversationType.GROUP;
    return this.createConversationUseCase.execute({ type });
  }

  @Post('advisor-client')
  async linkAdvisor(@Body() body: { advisorId: string; clientId: string }) {
    return this.linkAdvisorClientUseCase.execute(body);
  }

  @Post('messages')
  async postMessage(@Body() body: { conversationId: string; senderId: string; content: string }) {
    return this.sendMessageUseCase.execute(body);
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
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
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

  @Get('conversations/group/by-user/:userId')
  async listGroupConversationsByUser(@Param('userId') userId: string) {
    return this.listConversationsByUserUseCase.execute({ userId, type: 'GROUP' });
  }

  @Get('conversations/by-user/:userId')
  async listConversationsByUser(@Param('userId') userId: string) {
    return this.listConversationsByUserUseCase.execute({ userId });
  }

  @Get('advisor/:advisorId/clients')
  async listClients(@Param('advisorId') advisorId: string) {
    return this.listClientsOfAdvisor.execute({ advisorId });
  }

  @Get('client/:clientId/advisor')
  async getAdvisorOfClient(@Param('clientId') clientId: string) {
    return this.findAdvisorOfClient.execute({ clientId });
  }

  @Get('users/by-role/:role')
  async listUsersByRoleEndpoint(@Param('role') role: string) {
    const normalized = role.toUpperCase() as keyof typeof RoleName;
    if (!RoleName[normalized]) return [];
    return this.listUsersByRole.execute({ role: RoleName[normalized] });
  }

  @Post('conversations/:id/participants')
  async addParticipant(@Param('id') conversationId: string, @Body() body: { userId: string }) {
    return this.addConversationParticipant.execute({ conversationId, userId: body.userId });
  }

  @Get('conversations/:id/participants')
  async listParticipants(@Param('id') conversationId: string) {
    return this.listParticipantsDetails.execute({ conversationId });
  }

  // ─── Notifications de conversation ──────────────────────────────────────────

  @Patch('conversations/:id/notifications/mute')
  @UseGuards(JwtAuthGuard)
  async muteConversation(
    @Param('id') conversationId: string,
    @Body() body: { mutedUntil?: string },
    @Req() req: Request,
  ) {
    const userId = extractUserId(req);
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
    return this.setConversationMuteUC.execute({ userId, conversationId, muted: false });
  }

  @Get('conversations/:id/notifications/settings')
  @UseGuards(JwtAuthGuard)
  async getConversationNotificationSettings(
    @Param('id') conversationId: string,
    @Req() req: Request,
  ) {
    const userId = extractUserId(req);
    return this.getConversationSettingsUC.execute({ userId, conversationId });
  }

  // ─── État de lecture ──────────────────────────────────────────────────────

  @Patch('conversations/:id/state')
  @UseGuards(JwtAuthGuard)
  async updateConversationState(
    @Param('id') conversationId: string,
    @Body() body: { lastReadMessageId: string },
    @Req() req: Request,
  ) {
    const userId = extractUserId(req);
    return this.updateConversationStateUC.execute({
      userId,
      conversationId,
      lastReadMessageId: body.lastReadMessageId,
    });
  }
}
