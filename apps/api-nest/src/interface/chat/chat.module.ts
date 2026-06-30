import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import {
  AdvisorClientEntity,
  ConversationEntity,
  ConversationParticipantEntity,
  MessageEntity,
  UserEntity,
  RoleEntity,
  NotificationEntity,
  ConversationNotificationSettingsEntity,
  ConversationUserStateEntity,
} from '@forreal/infrastructure-typeorm';

import {
  IConversationRepository,
  IMessageRepository,
  IConversationParticipantRepository,
  IAdvisorClientRepository,
  INotificationRepository,
  IConversationNotificationSettingsRepository,
  IConversationUserStateRepository,
  IUserRepository,
} from '@forreal/domain';

import {
  ConversationRepository,
  MessageRepository,
  ConversationParticipantRepository,
  AdvisorClientRepository,
  NotificationRepository,
  ConversationNotificationSettingsRepository,
  ConversationUserStateRepository,
  UserRepository,
} from '@forreal/infrastructure-typeorm';

import {
  CreateConversationUseCase,
  AddConversationParticipantUseCase,
  SendMessageUseCase,
  ListMessagesUseCase,
  MarkMessageReadUseCase,
  LinkAdvisorClientUseCase,
  ListConversationsByUserUseCase,
  ListParticipantsDetailsByConversationUseCase,
  ListClientsOfAdvisorUseCase,
  FindAdvisorOfClientUseCase,
  ListUsersByRoleUseCase,
  MuteConversationUseCase,
  UnmuteConversationUseCase,
  GetConversationNotificationSettingsUseCase,
  UpdateConversationUserStateUseCase,
} from '@forreal/application';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      AdvisorClientEntity,
      ConversationEntity,
      ConversationParticipantEntity,
      MessageEntity,
      UserEntity,
      RoleEntity,
      NotificationEntity,
      ConversationNotificationSettingsEntity,
      ConversationUserStateEntity,
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
    { provide: INotificationRepository, useClass: NotificationRepository },
    {
      provide: IConversationNotificationSettingsRepository,
      useClass: ConversationNotificationSettingsRepository,
    },
    { provide: IConversationUserStateRepository, useClass: ConversationUserStateRepository },
    {
      provide: CreateConversationUseCase,
      useFactory: (repo: IConversationRepository) => new CreateConversationUseCase(repo),
      inject: [IConversationRepository],
    },
    {
      provide: AddConversationParticipantUseCase,
      useFactory: (repo: IConversationParticipantRepository) =>
        new AddConversationParticipantUseCase(repo),
      inject: [IConversationParticipantRepository],
    },
    {
      provide: SendMessageUseCase,
      useFactory: (
        messageRepo: IMessageRepository,
        participantRepo: IConversationParticipantRepository,
        notifRepo: INotificationRepository,
        settingsRepo: IConversationNotificationSettingsRepository,
      ) => new SendMessageUseCase(messageRepo, participantRepo, notifRepo, settingsRepo),
      inject: [
        IMessageRepository,
        IConversationParticipantRepository,
        INotificationRepository,
        IConversationNotificationSettingsRepository,
      ],
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
      useFactory: (advisorClientRepo: IAdvisorClientRepository, userRepo: IUserRepository) =>
        new ListClientsOfAdvisorUseCase(advisorClientRepo, userRepo),
      inject: [IAdvisorClientRepository, IUserRepository],
    },
    {
      provide: FindAdvisorOfClientUseCase,
      useFactory: (advisorClientRepo: IAdvisorClientRepository, userRepo: IUserRepository) =>
        new FindAdvisorOfClientUseCase(advisorClientRepo, userRepo),
      inject: [IAdvisorClientRepository, IUserRepository],
    },
    {
      provide: ListUsersByRoleUseCase,
      useFactory: (userRepo: IUserRepository) => new ListUsersByRoleUseCase(userRepo),
      inject: [IUserRepository],
    },
    {
      provide: MuteConversationUseCase,
      useFactory: (settingsRepo: IConversationNotificationSettingsRepository) =>
        new MuteConversationUseCase(settingsRepo),
      inject: [IConversationNotificationSettingsRepository],
    },
    {
      provide: UnmuteConversationUseCase,
      useFactory: (settingsRepo: IConversationNotificationSettingsRepository) =>
        new UnmuteConversationUseCase(settingsRepo),
      inject: [IConversationNotificationSettingsRepository],
    },
    {
      provide: GetConversationNotificationSettingsUseCase,
      useFactory: (settingsRepo: IConversationNotificationSettingsRepository) =>
        new GetConversationNotificationSettingsUseCase(settingsRepo),
      inject: [IConversationNotificationSettingsRepository],
    },
    {
      provide: UpdateConversationUserStateUseCase,
      useFactory: (
        stateRepo: IConversationUserStateRepository,
        notifRepo: INotificationRepository,
      ) => new UpdateConversationUserStateUseCase(stateRepo, notifRepo),
      inject: [IConversationUserStateRepository, INotificationRepository],
    },
  ],
  exports: [ChatService],
})
export class ChatModule {}
