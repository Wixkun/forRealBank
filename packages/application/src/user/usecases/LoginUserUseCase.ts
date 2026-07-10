import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
  ISessionIdGenerator,
  ITwoFactorVerifier,
} from '@forreal/domain';

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly sessionIdGenerator: ISessionIdGenerator,
    private readonly twoFactorVerifier: ITwoFactorVerifier,
  ) {}

  async execute(input: { email: string; password: string; twoFactorCode?: string }) {
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

    if (!user.emailVerified) {
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    if (user.twoFactorEnabled) {
      if (!input.twoFactorCode) throw new Error('TWO_FACTOR_REQUIRED');
      if (!user.twoFactorSecret) throw new Error('TWO_FACTOR_NOT_CONFIGURED');

      const secondFactorValid = await this.twoFactorVerifier.verify(
        user.twoFactorSecret,
        input.twoFactorCode,
      );
      if (!secondFactorValid) throw new Error('INVALID_TWO_FACTOR_CODE');
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
