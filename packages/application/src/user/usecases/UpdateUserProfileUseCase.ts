import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: {
    userId: string;
    firstName?: string;
    lastName?: string;
  }): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const firstName = (input.firstName ?? user.firstName ?? '').toString().replace(/\s+/g, ' ').trim();
    const lastName  = (input.lastName  ?? user.lastName  ?? '').toString().replace(/\s+/g, ' ').trim();
    if (!firstName || !lastName) throw new Error('INVALID_FULL_NAME');

    user.setNames(firstName, lastName);
    await this.userRepository.save(user);
  }
}
