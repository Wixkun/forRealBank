import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  AccountEntity,
  AdvisorClientEntity,
  AdvisorClientHistoryEntity,
  BankTransactionEntity,
  BanRequestEntity,
  ChatFileEntity,
  ConversationEntity,
  ConversationNotificationSettingsEntity,
  ConversationParticipantEntity,
  ConversationUserStateEntity,
  InvestmentAccountEntity,
  InvestmentTransactionEntity,
  MessageEntity,
  NotificationEntity,
  RoleEntity,
  UserEntity,
  AdvisorClientRepository,
  ConversationNotificationSettingsRepository,
  ConversationParticipantRepository,
  ConversationRepository,
  ConversationUserStateRepository,
  MessageRepository,
  NotificationRepository,
  UserRepository,
} from '@forreal/infrastructure-typeorm';
import {
  IAdvisorClientRepository,
  IConversationNotificationSettingsRepository,
  IConversationParticipantRepository,
  IConversationRepository,
  IConversationUserStateRepository,
  IMessageRepository,
  INotificationRepository,
  IUserRepository,
} from '@forreal/domain';
import {
  BanUserUseCase,
  EnsureConversationMemberUseCase,
  SendMessageUseCase,
} from '@forreal/application';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { NewsModule } from '../feed/news.module';
import { RolesGuard } from '../auth/roles.guard';
import { UsersManagementController } from './users-management.controller';
import { UsersManagementService } from './users-management.service';
import { AdvisorReassignmentService } from './advisor-reassignment.service';
import { BanRequestsService } from './ban-requests.service';
import { UsersManagementSchemaBootstrapService } from './users-management-schema-bootstrap.service';

@Module({
  imports: [
    AuthModule,
    ChatModule,
    NewsModule,
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      AdvisorClientEntity,
      AdvisorClientHistoryEntity,
      AccountEntity,
      InvestmentAccountEntity,
      BankTransactionEntity,
      InvestmentTransactionEntity,
      BanRequestEntity,
      NotificationEntity,
      ConversationEntity,
      ConversationParticipantEntity,
      ConversationUserStateEntity,
      ConversationNotificationSettingsEntity,
      MessageEntity,
      ChatFileEntity,
    ]),
  ],
  controllers: [UsersManagementController],
  providers: [
    RolesGuard,
    UsersManagementSchemaBootstrapService,
    UsersManagementService,
    AdvisorReassignmentService,
    BanRequestsService,
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
    { provide: IConversationRepository, useClass: ConversationRepository },
    { provide: IConversationParticipantRepository, useClass: ConversationParticipantRepository },
    { provide: IConversationUserStateRepository, useClass: ConversationUserStateRepository },
    { provide: IMessageRepository, useClass: MessageRepository },
    { provide: INotificationRepository, useClass: NotificationRepository },
    {
      provide: IConversationNotificationSettingsRepository,
      useClass: ConversationNotificationSettingsRepository,
    },
    {
      provide: EnsureConversationMemberUseCase,
      useFactory: (repo: IConversationParticipantRepository) =>
        new EnsureConversationMemberUseCase(repo),
      inject: [IConversationParticipantRepository],
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
      provide: BanUserUseCase,
      useFactory: (users: IUserRepository) => new BanUserUseCase(users),
      inject: [IUserRepository],
    },
  ],
})
export class UsersManagementModule {}
