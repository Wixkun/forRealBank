import { IAdvisorClientRepository } from '@forreal/domain';
import { IUserRepository } from '@forreal/domain';

export class ListClientsOfAdvisorUseCase {
  constructor(
    private readonly advisorClientRepository: IAdvisorClientRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: { advisorId: string }) {
    const links = await this.advisorClientRepository.listClientsOf(input.advisorId);
    const clients = await Promise.all(
      links.map(async (link) => {
        const user = await this.userRepository.findById(link.clientId);
        if (!user) return null;
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: Array.from(user.roles ?? []),
        };
      }),
    );

    return clients.filter((c) => c !== null);
  }
}
