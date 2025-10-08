import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { IPasswordHasher } from '@forreal/domain/user/ports/IPasswordHasher';
import { User } from '@forreal/domain/user/User';
import { randomUUID } from 'node:crypto';

type Input = { email: string; password: string; name?: string | null };
type Output = { id: string; email: string };

export class RegisterUserUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher
  ) {}

  async execute({ email, password, name }: Input): Promise<Output> {
    if (await this.users.existsByEmail(email)) {
      throw new Error('EMAIL_TAKEN');
    }
    const passwordHash = await this.hasher.hash(password);
    const user = new User(randomUUID(), email, passwordHash, name ?? null, new Date());
    await this.users.save(user);
    return { id: user.id, email: user.email };
  }
}
