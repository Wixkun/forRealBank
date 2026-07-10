import {
  EmailVerificationToken,
  IEmailService,
  IEmailVerificationTokenRepository,
  IUserRepository,
  IPasswordHasher,
  User,
  RoleName,
  IUserIdGenerator,
  isStrongPassword,
} from '@forreal/domain';
import {
  buildEmailVerificationUrl,
  createEmailVerificationTokenId,
  createRawEmailVerificationToken,
  EMAIL_VERIFICATION_EXPIRY_HOURS,
  hashEmailVerificationToken,
} from './email-verification';

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly userIdGenerator: IUserIdGenerator,
    private readonly verificationTokens: IEmailVerificationTokenRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    locale?: string;
  }) {
    const emailAlreadyUsed = await this.userRepository.existsByEmail(input.email);
    if (emailAlreadyUsed) throw new Error('EMAIL_ALREADY_REGISTERED');

    if (!isStrongPassword(input.password)) throw new Error('WEAK_PASSWORD');

    const firstName = (input.firstName ?? '').replace(/\s+/g, ' ').trim();
    const lastName = (input.lastName ?? '').replace(/\s+/g, ' ').trim();
    if (!firstName || !lastName) throw new Error('INVALID_FULL_NAME');

    const userId = this.userIdGenerator.generate();
    const creationDate = new Date();
    const hashedPassword = await this.passwordHasher.hash(input.password);

    const newUser = new User(
      userId,
      input.email,
      hashedPassword,
      new Set<RoleName>([RoleName.CLIENT]),
      creationDate,
      creationDate,
      firstName,
      lastName,
      undefined,
      false,
      undefined,
      false,
      undefined,
      undefined,
    );

    await this.userRepository.save(newUser);
    const rawToken = createRawEmailVerificationToken();
    const tokenHash = hashEmailVerificationToken(rawToken);
    const expiresAt = new Date(
      creationDate.getTime() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.verificationTokens.markUserTokensUsed(userId, creationDate);
    await this.verificationTokens.save(
      new EmailVerificationToken(
        createEmailVerificationTokenId(),
        userId,
        tokenHash,
        expiresAt,
        creationDate,
      ),
    );

    await this.emailService.sendEmailVerificationEmail({
      to: input.email,
      firstName,
      verificationUrl: buildEmailVerificationUrl(rawToken, input.locale),
      expiresInHours: EMAIL_VERIFICATION_EXPIRY_HOURS,
    });

    return { success: true };
  }
}
