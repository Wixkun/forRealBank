import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { ChatFilesService } from './chat-files.service';
import { ChatClusterBus } from './chat-cluster.bus';
import {
  AdvisorClientEntity,
  ConversationEntity,
  ConversationParticipantEntity,
  MessageEntity,
  ChatFileEntity,
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
  AddConversationParticipantUseCase,
  SendMessageUseCase,
  ListMessagesUseCase,
  MarkMessageReadUseCase,
  LinkAdvisorClientUseCase,
  ListConversationsByUserUseCase,
  ListParticipantsDetailsByConversationUseCase,
  ListClientsOfAdvisorUseCase,
  FindAdvisorOfClientUseCase,
  SetConversationMuteUseCase,
  GetConversationNotificationSettingsUseCase,
  UpdateConversationUserStateUseCase,
  EnsureConversationMemberUseCase,
  CreateGroupConversationUseCase,
  SetConversationHiddenUseCase,
  ListContactableUsersUseCase,
  OpenPrivateConversationUseCase,
  CanUseConversationUseCase,
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
      ChatFileEntity,
      UserEntity,
      RoleEntity,
      NotificationEntity,
      ConversationNotificationSettingsEntity,
      ConversationUserStateEntity,
    ]),
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatFilesService,
    ChatClusterBus,
    { provide: IConversationRepository, useClass: ConversationRepository },
    { provide: IMessageRepository, useClass: MessageRepository },
    { provide: IConversationParticipantRepository, useClass: ConversationParticipantRepository },
    { provide: IUserRepository, useClass: UserRepository },
    {
      provide: IAdvisorClientRepository,
      useFactory: (
        repo: Repository<AdvisorClientEntity>,
        userRepo: Repository<UserEntity>,
        dataSource: DataSource,
      ) => new AdvisorClientRepository(repo, userRepo, dataSource),
      inject: [getRepositoryToken(AdvisorClientEntity), getRepositoryToken(UserEntity), DataSource],
    },
    { provide: INotificationRepository, useClass: NotificationRepository },
    {
      provide: IConversationNotificationSettingsRepository,
      useClass: ConversationNotificationSettingsRepository,
    },
    { provide: IConversationUserStateRepository, useClass: ConversationUserStateRepository },
    {
      provide: AddConversationParticipantUseCase,
      useFactory: (repo: IConversationParticipantRepository) =>
        new AddConversationParticipantUseCase(repo),
      inject: [IConversationParticipantRepository],
    },
    {
      provide: EnsureConversationMemberUseCase,
      useFactory: (repo: IConversationParticipantRepository) =>
        new EnsureConversationMemberUseCase(repo),
      inject: [IConversationParticipantRepository],
    },
    {
      provide: CreateGroupConversationUseCase,
      useFactory: (
        conversationRepo: IConversationRepository,
        participantRepo: IConversationParticipantRepository,
        userRepo: IUserRepository,
        advisorClientRepo: IAdvisorClientRepository,
      ) =>
        new CreateGroupConversationUseCase(
          conversationRepo,
          participantRepo,
          userRepo,
          advisorClientRepo,
        ),
      inject: [
        IConversationRepository,
        IConversationParticipantRepository,
        IUserRepository,
        IAdvisorClientRepository,
      ],
    },
    {
      provide: SendMessageUseCase,
      useFactory: (
        messageRepo: IMessageRepository,
        participantRepo: IConversationParticipantRepository,
        notifRepo: INotificationRepository,
        settingsRepo: IConversationNotificationSettingsRepository,
        userStateRepo: IConversationUserStateRepository,
      ) =>
        new SendMessageUseCase(
          messageRepo,
          participantRepo,
          notifRepo,
          settingsRepo,
          userStateRepo,
        ),
      inject: [
        IMessageRepository,
        IConversationParticipantRepository,
        INotificationRepository,
        IConversationNotificationSettingsRepository,
        IConversationUserStateRepository,
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
        messageRepo: IMessageRepository,
        settingsRepo: IConversationNotificationSettingsRepository,
        userStateRepo: IConversationUserStateRepository,
      ) =>
        new ListConversationsByUserUseCase(
          participantRepo,
          conversationRepo,
          userRepo,
          messageRepo,
          settingsRepo,
          userStateRepo,
        ),
      inject: [
        IConversationParticipantRepository,
        IConversationRepository,
        IUserRepository,
        IMessageRepository,
        IConversationNotificationSettingsRepository,
        IConversationUserStateRepository,
      ],
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
      provide: SetConversationHiddenUseCase,
      useFactory: (userStateRepo: IConversationUserStateRepository) =>
        new SetConversationHiddenUseCase(userStateRepo),
      inject: [IConversationUserStateRepository],
    },
    {
      provide: CanUseConversationUseCase,
      useFactory: (
        conversationRepo: IConversationRepository,
        participantRepo: IConversationParticipantRepository,
        userRepo: IUserRepository,
        advisorClientRepo: IAdvisorClientRepository,
      ) =>
        new CanUseConversationUseCase(
          conversationRepo,
          participantRepo,
          userRepo,
          advisorClientRepo,
        ),
      inject: [
        IConversationRepository,
        IConversationParticipantRepository,
        IUserRepository,
        IAdvisorClientRepository,
      ],
    },
    {
      provide: ListContactableUsersUseCase,
      useFactory: (advisorClientRepo: IAdvisorClientRepository, userRepo: IUserRepository) =>
        new ListContactableUsersUseCase(advisorClientRepo, userRepo),
      inject: [IAdvisorClientRepository, IUserRepository],
    },
    {
      provide: OpenPrivateConversationUseCase,
      useFactory: (
        conversationRepo: IConversationRepository,
        participantRepo: IConversationParticipantRepository,
        userRepo: IUserRepository,
        userStateRepo: IConversationUserStateRepository,
        contactable: ListContactableUsersUseCase,
      ) =>
        new OpenPrivateConversationUseCase(
          conversationRepo,
          participantRepo,
          userRepo,
          userStateRepo,
          contactable,
        ),
      inject: [
        IConversationRepository,
        IConversationParticipantRepository,
        IUserRepository,
        IConversationUserStateRepository,
        ListContactableUsersUseCase,
      ],
    },
    {
      provide: SetConversationMuteUseCase,
      useFactory: (settingsRepo: IConversationNotificationSettingsRepository) =>
        new SetConversationMuteUseCase(settingsRepo),
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
  // ChatGateway est exporté pour la déconnexion immédiate lors d'un
  // bannissement (users) et les notifications temps réel (users-management).
  exports: [ChatGateway],
})
export class ChatModule {}
