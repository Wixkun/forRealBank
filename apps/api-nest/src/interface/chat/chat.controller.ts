import { Controller, Get, Post, Body, Param, Query, Inject } from '@nestjs/common';
import { ConversationType } from '@forreal/domain/chat/Conversation';
import { CreateConversationUseCase } from '@forreal/application/chat/usecases/CreateConversationUseCase';
import { SendMessageUseCase } from '@forreal/application/chat/usecases/SendMessageUseCase';
import { ListMessagesUseCase } from '@forreal/application/chat/usecases/ListMessagesUseCase';
import { MarkMessageReadUseCase } from '@forreal/application/chat/usecases/MarkMessageReadUseCase';
import { LinkAdvisorClientUseCase } from '@forreal/application/chat/usecases/LinkAdvisorClientUseCase';

@Controller('chat')
export class ChatController {
  constructor(
    @Inject(CreateConversationUseCase) private readonly createConversationUseCase: CreateConversationUseCase,
    @Inject(SendMessageUseCase) private readonly sendMessageUseCase: SendMessageUseCase,
    @Inject(ListMessagesUseCase) private readonly listMessagesUseCase: ListMessagesUseCase,
    @Inject(MarkMessageReadUseCase) private readonly markMessageReadUseCase: MarkMessageReadUseCase,
    @Inject(LinkAdvisorClientUseCase) private readonly linkAdvisorClientUseCase: LinkAdvisorClientUseCase,
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
}
