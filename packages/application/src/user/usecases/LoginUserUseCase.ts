import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { IPasswordHasher } from '@forreal/domain/user/ports/IPasswordHasher';
import { ITokenService } from '@forreal/domain/user/ports/ITokenService';
import { randomUUID } from 'crypto';

interface AccessTokenPayload {
  userId: string;
  sessionId: string;
  issuedAt: Date;
  expiresAt: Date;
  issuer: string;
  audience: string;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService,
  ) {}

  async execute(input: { email: string; password: string }): Promise<{ accessToken: string }> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const ok = await this.hasher.compare(input.password, user.passwordHash);
    if (!ok) throw new Error('INVALID_CREDENTIALS');

    user.markLogin();
    await this.userRepo.save(user);

    const sessionId = randomUUID();
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 15 * 60 * 1000);

    const payload: AccessTokenPayload = {
      userId: user.id,
      sessionId,
      issuedAt,
      expiresAt,
      issuer: 'forrealbank.auth',
      audience: 'forrealbank.api',
    };

    const accessToken = await this.tokens.sign(payload);

    return { accessToken };
  }
}
