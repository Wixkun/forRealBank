import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';

export class DeleteUserByAdminUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: { targetUserId: string; actingUserId: string }): Promise<void> {
    if (input.targetUserId === input.actingUserId) {
      throw new Error('FORBIDDEN_OPERATION');
    }
    const existing = await this.users.findById(input.targetUserId);
    if (!existing) throw new Error('USER_NOT_FOUND');
    await this.users.deleteById(input.targetUserId);
  }
}
