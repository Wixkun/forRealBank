import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';

export class BanUserUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: { targetUserId: string; reason?: string }): Promise<void> {
    const user = await this.users.findById(input.targetUserId);
    if (!user) throw new Error('USER_NOT_FOUND');
    user.ban(input.reason);
    await this.users.save(user);
  }
}
