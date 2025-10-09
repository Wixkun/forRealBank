import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { RoleName } from '@forreal/domain/user/RoleName';

export class UpdateUserRolesUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: { targetUserId: string; roles: RoleName[]; actingUserId: string }): Promise<void> {
    const target = await this.users.findById(input.targetUserId);
    if (!target) throw new Error('USER_NOT_FOUND');

    if (input.targetUserId === input.actingUserId && !input.roles.includes(RoleName.ADMIN)) {
      throw new Error('FORBIDDEN_OPERATION');
    }

    const unique = Array.from(new Set(input.roles));
    if (!unique.length) throw new Error('INVALID_ROLE');

    (target as any)._roles = new Set<RoleName>(unique);
    target.touch();
    await this.users.save(target);
  }
}
