import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { User } from '@forreal/domain/user/User';

export class ListUsersUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: { limit?: number; offset?: number; search?: string } = {}): Promise<{
    items: User[];
    total: number;
  }> {
    const [items, total] = await Promise.all([
      this.users.list(input),
      this.users.count({ search: input.search }),
    ]);
    return { items, total };
  }
}
