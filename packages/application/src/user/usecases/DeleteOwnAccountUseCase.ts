import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';

export class DeleteOwnAccountUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: { userId: string }): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    await this.userRepository.deleteById(user.id);
  }
}
