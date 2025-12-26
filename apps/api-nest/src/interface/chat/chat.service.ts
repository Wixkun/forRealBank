import { Injectable, Inject } from '@nestjs/common';
import { ConversationType } from '@forreal/domain/chat/Conversation';
import { CreateConversationUseCase } from '@forreal/application/chat/usecases/CreateConversationUseCase';
import { AddConversationParticipantUseCase } from '@forreal/application/chat/usecases/AddConversationParticipantUseCase';
import { SendMessageUseCase } from '@forreal/application/chat/usecases/SendMessageUseCase';
import { ListMessagesUseCase } from '@forreal/application/chat/usecases/ListMessagesUseCase';
import { MarkMessageReadUseCase } from '@forreal/application/chat/usecases/MarkMessageReadUseCase';
import { LinkAdvisorClientUseCase } from '@forreal/application/chat/usecases/LinkAdvisorClientUseCase';

@Injectable()
export class ChatService {
  constructor(
    @Inject(CreateConversationUseCase) private readonly createConversation: CreateConversationUseCase,
    @Inject(AddConversationParticipantUseCase) private readonly addParticipant: AddConversationParticipantUseCase,
    @Inject(SendMessageUseCase) private readonly sendMessageUC: SendMessageUseCase,
    @Inject(ListMessagesUseCase) private readonly listMessagesUC: ListMessagesUseCase,
    @Inject(MarkMessageReadUseCase) private readonly markReadUC: MarkMessageReadUseCase,
    @Inject(LinkAdvisorClientUseCase) private readonly linkAdvisorClient: LinkAdvisorClientUseCase,
  ) {}

  async linkAdvisorToClient(advisorId: string, clientId: string) {
    return this.linkAdvisorClient.execute({ advisorId, clientId });
  }

  async createConversationPrivate() {
    return this.createConversation.execute({ type: ConversationType.PRIVATE });
  }

  async createConversationGroup() {
    return this.createConversation.execute({ type: ConversationType.GROUP });
  }

  async addParticipantToConversation(conversationId: string, userId: string) {
    return this.addParticipant.execute({ conversationId, userId });
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    return this.sendMessageUC.execute({ conversationId, senderId, content });
  }

  async listMessages(conversationId: string, limit = 50, offset = 0) {
    return this.listMessagesUC.execute({ conversationId, limit, offset });
  }

  async markMessageRead(messageId: string) {
    return this.markReadUC.execute({ messageId });
  }
}
