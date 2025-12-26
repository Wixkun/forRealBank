import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';

export class BanUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: { targetUserId: string; reason?: string }): Promise<void> {
    const targetUser = await this.userRepository.findById(input.targetUserId);
    if (!targetUser) throw new Error('USER_NOT_FOUND');
    targetUser.ban(input.reason);
    await this.userRepository.save(targetUser);
  }
}
