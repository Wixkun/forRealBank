import { IAdvisorClientRepository } from '@forreal/domain/chat/ports/IAdvisorClientRepository';

export class LinkAdvisorClientUseCase {
  constructor(private readonly advisorClientRepository: IAdvisorClientRepository) {}

  async execute(input: { advisorId: string; clientId: string }) {
    const link = await this.advisorClientRepository.link(input.advisorId, input.clientId);
    return { linkId: link.id, advisorId: link.advisorId, clientId: link.clientId, createdAt: link.createdAt };
  }
}
