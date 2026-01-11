import { Controller, Get, Post, Body, Param, Query, Inject } from '@nestjs/common';
import { ConversationType } from '@forreal/domain';
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
import { RoleName } from '@forreal/domain';

@Controller('chat')
export class ChatController {
  constructor(
    @Inject(CreateConversationUseCase) private readonly createConversationUseCase: CreateConversationUseCase,
    @Inject(SendMessageUseCase) private readonly sendMessageUseCase: SendMessageUseCase,
    @Inject(ListMessagesUseCase) private readonly listMessagesUseCase: ListMessagesUseCase,
    @Inject(MarkMessageReadUseCase) private readonly markMessageReadUseCase: MarkMessageReadUseCase,
    @Inject(LinkAdvisorClientUseCase) private readonly linkAdvisorClientUseCase: LinkAdvisorClientUseCase,
    @Inject(ListConversationsByUserUseCase) private readonly listConversationsByUserUseCase: ListConversationsByUserUseCase,
    @Inject(ListParticipantsDetailsByConversationUseCase) private readonly listParticipantsDetails: ListParticipantsDetailsByConversationUseCase,
    @Inject(AddConversationParticipantUseCase) private readonly addConversationParticipant: AddConversationParticipantUseCase,
    @Inject(ListClientsOfAdvisorUseCase) private readonly listClientsOfAdvisor: ListClientsOfAdvisorUseCase,
    @Inject(FindAdvisorOfClientUseCase) private readonly findAdvisorOfClient: FindAdvisorOfClientUseCase,
    @Inject(ListUsersByRoleUseCase) private readonly listUsersByRole: ListUsersByRoleUseCase,
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
    if (!RoleName[normalized]) {
      return [];
    }
    return this.listUsersByRole.execute({ role: RoleName[normalized] });
  }

  @Post('conversations/:id/participants')
  async addParticipant(
    @Param('id') conversationId: string,
    @Body() body: { userId: string },
  ) {
    return this.addConversationParticipant.execute({ conversationId, userId: body.userId });
  }

  @Get('conversations/:id/participants')
  async listParticipants(@Param('id') conversationId: string) {
    return this.listParticipantsDetails.execute({ conversationId });
  }
}
