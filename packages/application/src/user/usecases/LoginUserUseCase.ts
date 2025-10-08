import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { IPasswordHasher } from '@forreal/domain/user/ports/IPasswordHasher';
import { ITokenService } from '@forreal/domain/user/ports/ITokenService';

type Input = { email: string; password: string };
type Output = { accessToken: string };

export class LoginUserUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService
  ) {}

  async execute({ email, password }: Input): Promise<Output> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const ok = await this.hasher.compare(password, user.passwordHash);
    if (!ok) throw new Error('INVALID_CREDENTIALS');

    const accessToken = await this.tokens.sign({ sub: user.id, email: user.email });
    return { accessToken };
  }
}
