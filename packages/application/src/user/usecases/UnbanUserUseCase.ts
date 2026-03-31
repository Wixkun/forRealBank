import { IUserRepository } from '@forreal/domain';

export class UnbanUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: { targetUserId: string }): Promise<void> {
    const targetUser = await this.userRepository.findById(input.targetUserId);
    if (!targetUser) throw new Error('USER_NOT_FOUND');
    targetUser.unban();
    await this.userRepository.save(targetUser);
  }
}
