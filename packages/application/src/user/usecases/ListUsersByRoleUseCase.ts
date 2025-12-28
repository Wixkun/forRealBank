import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { RoleName } from '@forreal/domain/user/RoleName';

export class ListUsersByRoleUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: { role: RoleName }) {
    const users = await this.userRepository.list();
    return users
      .filter((u) => u.roles && u.roles.has(input.role))
      .map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        roles: Array.from(u.roles ?? []),
      }));
  }
}
