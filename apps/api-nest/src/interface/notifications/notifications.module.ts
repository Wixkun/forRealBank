import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationEntity } from '@forreal/infrastructure-typeorm/entities/NotificationEntity';
import { UserEntity } from '@forreal/infrastructure-typeorm/entities/UserEntity';

import { INotificationRepository } from '@forreal/domain/notifications/ports/INotificationRepository';
import { NotificationRepository } from '@forreal/infrastructure-typeorm/repositories/NotificationRepository';

import { SendNotificationUseCase } from '@forreal/application/notifications/usecases/SendNotificationUseCase';
import { MarkNotificationReadUseCase } from '@forreal/application/notifications/usecases/MarkNotificationReadUseCase';
import { ListNotificationsByUserUseCase } from '@forreal/application/notifications/usecases/ListNotificationsByUserUseCase';

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
