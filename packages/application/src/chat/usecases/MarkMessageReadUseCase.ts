import { IMessageRepository } from '@forreal/domain/chat/ports/IMessageRepository';

export class MarkMessageReadUseCase {
  constructor(private readonly messageRepository: IMessageRepository) {}

  async execute(input: { messageId: string }) {
    const message = await this.messageRepository.findById(input.messageId);
    if (!message) throw new Error('MESSAGE_NOT_FOUND');
    message.markAsRead();
    await this.messageRepository.save(message);
    return { success: true };
  }
}
