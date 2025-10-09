import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';

export class UpdateUserProfileUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: {
    userId: string;
    firstName?: string;
    lastName?: string;
  }): Promise<void> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const first = (input.firstName ?? user.firstName ?? '').toString().replace(/\s+/g, ' ').trim();
    const last  = (input.lastName  ?? user.lastName  ?? '').toString().replace(/\s+/g, ' ').trim();
    if (!first || !last) throw new Error('INVALID_FULL_NAME');

    user.setNames(first, last);
    await this.users.save(user);
  }
}
