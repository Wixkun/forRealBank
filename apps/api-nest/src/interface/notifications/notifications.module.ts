import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationEntity, UserEntity } from '@forreal/infrastructure-typeorm';
import { INotificationRepository } from '@forreal/domain';
import { NotificationRepository } from '@forreal/infrastructure-typeorm';
import {
  ListNotificationsByUserUseCase,
  GetUnreadCountUseCase,
  MarkNotificationReadUseCase,
  MarkAllNotificationsReadUseCase,
  DeleteNotificationUseCase,
} from '@forreal/application';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([NotificationEntity, UserEntity])],
  controllers: [NotificationsController],
  providers: [
    { provide: INotificationRepository, useClass: NotificationRepository },
    {
      provide: ListNotificationsByUserUseCase,
      useFactory: (repo: INotificationRepository) => new ListNotificationsByUserUseCase(repo),
      inject: [INotificationRepository],
    },
    {
      provide: GetUnreadCountUseCase,
      useFactory: (repo: INotificationRepository) => new GetUnreadCountUseCase(repo),
      inject: [INotificationRepository],
    },
    {
      provide: MarkNotificationReadUseCase,
      useFactory: (repo: INotificationRepository) => new MarkNotificationReadUseCase(repo),
      inject: [INotificationRepository],
    },
    {
      provide: MarkAllNotificationsReadUseCase,
      useFactory: (repo: INotificationRepository) => new MarkAllNotificationsReadUseCase(repo),
      inject: [INotificationRepository],
    },
    {
      provide: DeleteNotificationUseCase,
      useFactory: (repo: INotificationRepository) => new DeleteNotificationUseCase(repo),
      inject: [INotificationRepository],
    },
  ],
  exports: [INotificationRepository],
})
export class NotificationsModule {}
