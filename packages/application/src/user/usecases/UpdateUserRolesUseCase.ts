import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { RoleName } from '@forreal/domain/user/RoleName';

export class UpdateUserRolesUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: { targetUserId: string; roles: RoleName[]; actingUserId: string }): Promise<void> {
    const targetUser = await this.userRepository.findById(input.targetUserId);
    if (!targetUser) throw new Error('USER_NOT_FOUND');

    if (input.targetUserId === input.actingUserId && !input.roles.includes(RoleName.ADMIN)) {
      throw new Error('FORBIDDEN_OPERATION');
    }

    const uniqueRoles = Array.from(new Set(input.roles));
    if (!uniqueRoles.length) throw new Error('INVALID_ROLE');

    (targetUser as any)._roles = new Set<RoleName>(uniqueRoles);
    targetUser.touch();
    await this.userRepository.save(targetUser);
  }
}
