import {
  IMessageRepository,
  IConversationParticipantRepository,
  INotificationRepository,
  NotificationType,
  ConversationParticipant,
} from '@forreal/domain';

export class SendMessageUseCase {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly conversationParticipantRepository: IConversationParticipantRepository,
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(input: { conversationId: string; senderId: string; content: string }) {
    const message = await this.messageRepository.create(
      input.conversationId,
      input.senderId,
      input.content,
    );

    const participants = await this.conversationParticipantRepository.listByConversation(
      input.conversationId,
    );

    const notificationPromises = participants
      .filter((participant: ConversationParticipant) => participant.userId !== input.senderId)
      .map((participant: ConversationParticipant) =>
        this.notificationRepository.create(
          participant.userId,
          'Nouveau message',
          `Vous avez reçu un nouveau message`,
          NotificationType.MESSAGE_RECEIVED,
        ),
      );

    await Promise.all(notificationPromises);

    return {
      messageId: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
    };
  }
}
