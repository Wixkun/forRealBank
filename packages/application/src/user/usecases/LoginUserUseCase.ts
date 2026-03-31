import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
  ISessionIdGenerator,
} from '@forreal/domain';

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly sessionIdGenerator: ISessionIdGenerator,
  ) {}

  async execute(input: { email: string; password: string }) {
    // valeurs par défaut raisonnables (à externaliser en config si besoin)
    const MAX_ATTEMPTS = 5;
    const LOCK_MS = 15 * 60 * 1000;

    const now = new Date();
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) throw new Error('INVALID_CREDENTIALS');

    if (user.isLocked(now)) {
      throw new Error('ACCOUNT_LOCKED');
    }

    const valid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!valid) {
      user.recordFailedLogin(MAX_ATTEMPTS, LOCK_MS, now);
      await this.userRepository.save(user);
      throw new Error('INVALID_CREDENTIALS');
    }

    user.markLogin(now);
    await this.userRepository.save(user);

    const sessionId = this.sessionIdGenerator.generate();
    const issuedAt = now;
    const expiresAt = new Date(issuedAt.getTime() + 15 * 60 * 1000);

    const accessToken = await this.tokenService.sign({
      userId: user.id,
      sessionId,
      issuedAt,
      expiresAt,
      issuer: 'forrealbank.auth',
      audience: 'forrealbank.api',
    });

    return { accessToken };
  }
}
