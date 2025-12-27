import { Controller, Get, Post, Body, Param, Query, Inject } from '@nestjs/common';
import { ConversationType } from '@forreal/domain/chat/Conversation';
import { CreateConversationUseCase } from '@forreal/application/chat/usecases/CreateConversationUseCase';
import { SendMessageUseCase } from '@forreal/application/chat/usecases/SendMessageUseCase';
import { ListMessagesUseCase } from '@forreal/application/chat/usecases/ListMessagesUseCase';
import { MarkMessageReadUseCase } from '@forreal/application/chat/usecases/MarkMessageReadUseCase';
import { LinkAdvisorClientUseCase } from '@forreal/application/chat/usecases/LinkAdvisorClientUseCase';
import { ListConversationsByUserUseCase } from '@forreal/application/chat/usecases/ListConversationsByUserUseCase';
import { ListParticipantsDetailsByConversationUseCase } from '@forreal/application/chat/usecases/ListParticipantsDetailsByConversationUseCase';
import { AddConversationParticipantUseCase } from '@forreal/application/chat/usecases/AddConversationParticipantUseCase';

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
