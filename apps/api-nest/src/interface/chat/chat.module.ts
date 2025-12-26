import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { AdvisorClientEntity } from '@forreal/infrastructure-typeorm/entities/AdvisorClientEntity';
import { ConversationEntity } from '@forreal/infrastructure-typeorm/entities/ConversationEntity';
import { ConversationParticipantEntity } from '@forreal/infrastructure-typeorm/entities/ConversationParticipantEntity';
import { MessageEntity } from '@forreal/infrastructure-typeorm/entities/MessageEntity';
import { UserEntity } from '@forreal/infrastructure-typeorm/entities/UserEntity';

import { IConversationRepository } from '@forreal/domain/chat/ports/IConversationRepository';
import { IMessageRepository } from '@forreal/domain/chat/ports/IMessageRepository';
import { IConversationParticipantRepository } from '@forreal/domain/chat/ports/IConversationParticipantRepository';
import { IAdvisorClientRepository } from '@forreal/domain/chat/ports/IAdvisorClientRepository';

import { ConversationRepository } from '@forreal/infrastructure-typeorm/repositories/ConversationRepository';
import { MessageRepository } from '@forreal/infrastructure-typeorm/repositories/MessageRepository';
import { ConversationParticipantRepository } from '@forreal/infrastructure-typeorm/repositories/ConversationParticipantRepository';
import { AdvisorClientRepository } from '@forreal/infrastructure-typeorm/repositories/AdvisorClientRepository';

import { CreateConversationUseCase } from '@forreal/application/chat/usecases/CreateConversationUseCase';
import { AddConversationParticipantUseCase } from '@forreal/application/chat/usecases/AddConversationParticipantUseCase';
import { SendMessageUseCase } from '@forreal/application/chat/usecases/SendMessageUseCase';
import { ListMessagesUseCase } from '@forreal/application/chat/usecases/ListMessagesUseCase';
import { MarkMessageReadUseCase } from '@forreal/application/chat/usecases/MarkMessageReadUseCase';
import { LinkAdvisorClientUseCase } from '@forreal/application/chat/usecases/LinkAdvisorClientUseCase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdvisorClientEntity,
      ConversationEntity,
      ConversationParticipantEntity,
      MessageEntity,
      UserEntity,
    ]),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    { provide: IConversationRepository, useClass: ConversationRepository },
    { provide: IMessageRepository, useClass: MessageRepository },
    { provide: IConversationParticipantRepository, useClass: ConversationParticipantRepository },
    { provide: IAdvisorClientRepository, useClass: AdvisorClientRepository },
    {
      provide: CreateConversationUseCase,
      useFactory: (repo: IConversationRepository) => new CreateConversationUseCase(repo),
      inject: [IConversationRepository],
    },
    {
      provide: AddConversationParticipantUseCase,
      useFactory: (
        repo: IConversationParticipantRepository,
      ) => new AddConversationParticipantUseCase(repo),
      inject: [IConversationParticipantRepository],
    },
    {
      provide: SendMessageUseCase,
      useFactory: (repo: IMessageRepository) => new SendMessageUseCase(repo),
      inject: [IMessageRepository],
    },
    {
      provide: ListMessagesUseCase,
      useFactory: (repo: IMessageRepository) => new ListMessagesUseCase(repo),
      inject: [IMessageRepository],
    },
    {
      provide: MarkMessageReadUseCase,
      useFactory: (repo: IMessageRepository) => new MarkMessageReadUseCase(repo),
      inject: [IMessageRepository],
    },
    {
      provide: LinkAdvisorClientUseCase,
      useFactory: (repo: IAdvisorClientRepository) => new LinkAdvisorClientUseCase(repo),
      inject: [IAdvisorClientRepository],
    },
  ],
  exports: [ChatService],
})
export class ChatModule {}
