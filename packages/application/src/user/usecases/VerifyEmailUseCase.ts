import { IEmailVerificationTokenRepository, IUserRepository } from '@forreal/domain';
import { hashEmailVerificationToken } from './email-verification';

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationTokens: IEmailVerificationTokenRepository,
  ) {}

  async execute(input: { token: string }) {
    const rawToken = input.token?.trim();
    if (!rawToken) {
      throw new Error('INVALID_EMAIL_VERIFICATION_TOKEN');
    }

    const tokenHash = hashEmailVerificationToken(rawToken);
    const verificationToken = await this.verificationTokens.findByHash(tokenHash);

    if (!verificationToken || !verificationToken.isUsable()) {
      throw new Error('INVALID_EMAIL_VERIFICATION_TOKEN');
    }

    const user = await this.userRepository.findById(verificationToken.userId);
    if (!user) {
      throw new Error('INVALID_EMAIL_VERIFICATION_TOKEN');
    }

    const now = new Date();
    verificationToken.markUsed(now);
    user.markEmailVerified(now);

    await this.verificationTokens.save(verificationToken);
    await this.userRepository.save(user);

    // L'appelant déclenche l'initialisation du client (comptes, carte,
    // conseiller) une fois l'inscription validée.
    return { success: true, userId: user.id };
  }
}
