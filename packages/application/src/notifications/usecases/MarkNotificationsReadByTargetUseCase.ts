import { INotificationRepository, NotificationTargetType } from '@forreal/domain';

/**
 * Marque lues toutes les notifications de l'utilisateur ciblant une entité
 * donnée (ex. consultation du détail d'une news / d'un virement) : le badge
 * disparaît sans que l'utilisateur ait à ouvrir le centre de notifications.
 */
export class MarkNotificationsReadByTargetUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: { userId: string; targetType: NotificationTargetType; targetId: string }) {
    const affected = await this.notificationRepository.markAsReadByTarget(
      input.userId,
      input.targetType,
      input.targetId,
    );
    return { success: true, affected };
  }
}
