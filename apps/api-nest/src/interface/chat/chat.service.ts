import { Injectable, Inject } from '@nestjs/common';
import { ConversationType } from '@forreal/domain';
import { CreateConversationUseCase } from '@forreal/application';
import { AddConversationParticipantUseCase } from '@forreal/application';
import { SendMessageUseCase } from '@forreal/application';
import { ListMessagesUseCase } from '@forreal/application';
import { MarkMessageReadUseCase } from '@forreal/application';
import { LinkAdvisorClientUseCase } from '@forreal/application';

@Injectable()
export class ChatService {
  constructor(
    @Inject(CreateConversationUseCase)
    private readonly createConversation: CreateConversationUseCase,
    @Inject(AddConversationParticipantUseCase)
    private readonly addParticipant: AddConversationParticipantUseCase,
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
