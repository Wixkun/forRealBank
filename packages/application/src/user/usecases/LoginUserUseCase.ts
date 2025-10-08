import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { IPasswordHasher } from '@forreal/domain/user/ports/IPasswordHasher';
import { ITokenService } from '@forreal/domain/user/ports/ITokenService';
import { randomUUID } from 'crypto';

export class LoginUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService,
  ) {}

  async execute(input: { email: string; password: string })
    : Promise<{ accessToken: string }> {

    const user = await this.userRepo.findByEmail(input.email);
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const ok = await this.hasher.compare(input.password, user.passwordHash);
    if (!ok) throw new Error('INVALID_CREDENTIALS');

    user.markLogin();
    await this.userRepo.save(user);

    const sessionId = randomUUID();
    const accessToken = await this.tokens.sign({
      sub: sessionId,
      jti: sessionId,
      iss: 'forrealbank.auth',
      aud: 'forrealbank.api',
    });

    return { accessToken };
  }
}
