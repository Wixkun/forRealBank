import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { User } from '@forreal/domain/user/User';

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: { limit?: number; offset?: number; search?: string } = {}): Promise<{
    items: User[];
    total: number;
  }> {
    const [items, total] = await Promise.all([
      this.userRepository.list(input),
      this.userRepository.count({ search: input.search }),
    ]);
    return { items, total };
  }
}
