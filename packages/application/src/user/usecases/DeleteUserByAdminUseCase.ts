import { IUserRepository } from '@forreal/domain';

export class DeleteUserByAdminUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: { targetUserId: string; actingUserId: string }): Promise<void> {
    if (input.targetUserId === input.actingUserId) {
      throw new Error('FORBIDDEN_OPERATION');
    }
    const userToDelete = await this.userRepository.findById(input.targetUserId);
    if (!userToDelete) throw new Error('USER_NOT_FOUND');
    await this.userRepository.deleteById(input.targetUserId);
  }
}
