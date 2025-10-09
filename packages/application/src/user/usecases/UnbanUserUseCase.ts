import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';

export class UnbanUserUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: { targetUserId: string }): Promise<void> {
    const user = await this.users.findById(input.targetUserId);
    if (!user) throw new Error('USER_NOT_FOUND');
    user.unban();
    await this.users.save(user);
  }
}
