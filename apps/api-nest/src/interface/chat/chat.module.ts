import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { AdvisorClientEntity } from '@forreal/infrastructure-typeorm';
import { ConversationEntity } from '@forreal/infrastructure-typeorm';
import { ConversationParticipantEntity } from '@forreal/infrastructure-typeorm';
import { MessageEntity } from '@forreal/infrastructure-typeorm';
import { UserEntity } from '@forreal/infrastructure-typeorm';
import { RoleEntity } from '@forreal/infrastructure-typeorm';

import { IConversationRepository } from '@forreal/domain';
import { IMessageRepository } from '@forreal/domain';
import { IConversationParticipantRepository } from '@forreal/domain';
import { IAdvisorClientRepository } from '@forreal/domain';

import { ConversationRepository } from '@forreal/infrastructure-typeorm';
import { MessageRepository } from '@forreal/infrastructure-typeorm';
import { ConversationParticipantRepository } from '@forreal/infrastructure-typeorm';
import { AdvisorClientRepository } from '@forreal/infrastructure-typeorm';

import { CreateConversationUseCase } from '@forreal/application';
import { AddConversationParticipantUseCase } from '@forreal/application';
import { SendMessageUseCase } from '@forreal/application';
import { ListMessagesUseCase } from '@forreal/application';
import { MarkMessageReadUseCase } from '@forreal/application';
import { LinkAdvisorClientUseCase } from '@forreal/application';
import { ListConversationsByUserUseCase } from '@forreal/application';
import { ListParticipantsDetailsByConversationUseCase } from '@forreal/application';
import { ListClientsOfAdvisorUseCase } from '@forreal/application';
import { FindAdvisorOfClientUseCase } from '@forreal/application';
import { ListUsersByRoleUseCase } from '@forreal/application';
import { IUserRepository } from '@forreal/domain';
import { UserRepository } from '@forreal/infrastructure-typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdvisorClientEntity,
      ConversationEntity,
      ConversationParticipantEntity,
      MessageEntity,
      UserEntity,
      RoleEntity,
    ]),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    { provide: IConversationRepository, useClass: ConversationRepository },
    { provide: IMessageRepository, useClass: MessageRepository },
    { provide: IConversationParticipantRepository, useClass: ConversationParticipantRepository },
    { provide: IUserRepository, useClass: UserRepository },
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
    {
      provide: ListConversationsByUserUseCase,
      useFactory: (
        participantRepo: IConversationParticipantRepository,
        conversationRepo: IConversationRepository,
        userRepo: IUserRepository,
      ) => new ListConversationsByUserUseCase(participantRepo, conversationRepo, userRepo),
      inject: [IConversationParticipantRepository, IConversationRepository, IUserRepository],
    },
    {
      provide: ListParticipantsDetailsByConversationUseCase,
      useFactory: (
        participantRepo: IConversationParticipantRepository,
        userRepo: IUserRepository,
      ) => new ListParticipantsDetailsByConversationUseCase(participantRepo, userRepo),
      inject: [IConversationParticipantRepository, IUserRepository],
    },
    {
      provide: ListClientsOfAdvisorUseCase,
      useFactory: (
        advisorClientRepo: IAdvisorClientRepository,
        userRepo: IUserRepository,
      ) => new ListClientsOfAdvisorUseCase(advisorClientRepo, userRepo),
      inject: [IAdvisorClientRepository, IUserRepository],
    },
    {
      provide: FindAdvisorOfClientUseCase,
      useFactory: (
        advisorClientRepo: IAdvisorClientRepository,
        userRepo: IUserRepository,
      ) => new FindAdvisorOfClientUseCase(advisorClientRepo, userRepo),
      inject: [IAdvisorClientRepository, IUserRepository],
    },
    {
      provide: ListUsersByRoleUseCase,
      useFactory: (userRepo: IUserRepository) => new ListUsersByRoleUseCase(userRepo),
      inject: [IUserRepository],
    },
  ],
  exports: [ChatService],
})
export class ChatModule {}
