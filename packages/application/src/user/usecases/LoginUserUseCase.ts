import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { IPasswordHasher } from '@forreal/domain/user/ports/IPasswordHasher';
import { ITokenService } from '@forreal/domain/user/ports/ITokenService';
import { randomUUID } from 'crypto';

const TOKEN_EXPIRY_MINUTES = 15;

/**
 * Access Token Payload
 * Data structure encoded in JWT tokens
 * @interface AccessTokenPayload
 */
interface AccessTokenPayload {
  userId: string;
  sessionId: string;
  issuedAt: Date;
  expiresAt: Date;
  issuer: string;
  audience: string;
}

/**
 * Login User Use Case
 * Authenticates a user with email and password, generates JWT token
 * @class LoginUserUseCase
 */
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
  ) {}

  /**
   * Execute login operation
   * Validates credentials, updates last login timestamp, and generates token
   * @param input - Login credentials (email and password)
   * @returns Promise containing the generated access token
   * @throws Error with code INVALID_CREDENTIALS if credentials are invalid
   */
  async execute(input: { email: string; password: string }): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const isPasswordValid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!isPasswordValid) throw new Error('INVALID_CREDENTIALS');

    user.markLogin();
    await this.userRepository.save(user);

    const sessionId = randomUUID();
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    const payload: AccessTokenPayload = {
      userId: user.id,
      sessionId,
      issuedAt,
      expiresAt,
      issuer: 'forrealbank.auth',
      audience: 'forrealbank.api',
    };

    const accessToken = await this.tokenService.sign(payload);

    return { accessToken };
  }
}
