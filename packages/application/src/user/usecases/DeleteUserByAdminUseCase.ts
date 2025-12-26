import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';

/**
 * Delete User By Admin Use Case
 * Allows administrators to delete other users (but not themselves)
 * @class DeleteUserByAdminUseCase
 */
export class DeleteUserByAdminUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Execute user deletion by admin
   * @param input - Deletion parameters (targetUserId and actingUserId)
   * @returns Promise that resolves when deletion is complete
   * @throws Error with code FORBIDDEN_OPERATION if attempting to delete self
   * @throws Error with code USER_NOT_FOUND if user does not exist
   */
  async execute(input: { targetUserId: string; actingUserId: string }): Promise<void> {
    if (input.targetUserId === input.actingUserId) {
      throw new Error('FORBIDDEN_OPERATION');
    }
    const userToDelete = await this.userRepository.findById(input.targetUserId);
    if (!userToDelete) throw new Error('USER_NOT_FOUND');
    await this.userRepository.deleteById(input.targetUserId);
  }
}
