import { IAdvisorClientRepository } from '@forreal/domain';
import { IUserRepository } from '@forreal/domain';

export class FindAdvisorOfClientUseCase {
  constructor(
    private readonly advisorClientRepository: IAdvisorClientRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: { clientId: string }) {
    const link = await this.advisorClientRepository.findAdvisorOf(input.clientId);
    if (!link) return null;

    const advisor = await this.userRepository.findById(link.advisorId);
    if (!advisor) return null;

    return {
      id: advisor.id,
      firstName: advisor.firstName,
      lastName: advisor.lastName,
      roles: Array.from(advisor.roles ?? []),
    };
  }
}
