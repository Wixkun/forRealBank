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
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const valid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!valid) throw new Error('INVALID_CREDENTIALS');

    user.markLogin();
    await this.userRepository.save(user);

    const sessionId = this.sessionIdGenerator.generate();
    const issuedAt = new Date();
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
