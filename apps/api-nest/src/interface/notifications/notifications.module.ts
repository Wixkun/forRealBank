import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationEntity } from '@forreal/infrastructure-typeorm';
import { UserEntity } from '@forreal/infrastructure-typeorm';

import { INotificationRepository } from '@forreal/domain';
import { NotificationRepository } from '@forreal/infrastructure-typeorm';

import { SendNotificationUseCase } from '@forreal/application';
import { MarkNotificationReadUseCase } from '@forreal/application';
import { ListNotificationsByUserUseCase } from '@forreal/application';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity, UserEntity])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    { provide: INotificationRepository, useClass: NotificationRepository },
    {
      provide: SendNotificationUseCase,
      useFactory: (repo) => new SendNotificationUseCase(repo),
      inject: [INotificationRepository],
    },
    {
      provide: MarkNotificationReadUseCase,
      useFactory: (repo) => new MarkNotificationReadUseCase(repo),
      inject: [INotificationRepository],
    },
    {
      provide: ListNotificationsByUserUseCase,
      useFactory: (repo) => new ListNotificationsByUserUseCase(repo),
      inject: [INotificationRepository],
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
