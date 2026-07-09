import { createHash, randomBytes, randomUUID } from 'node:crypto';
import {
  IEmailService,
  IPasswordResetTokenRepository,
  IUserRepository,
  PasswordResetToken,
} from '@forreal/domain';

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_EXPIRY_MINUTES = 30;

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function resolveWebAppUrl(): string {
  return (
    process.env.WEB_APP_URL?.trim() ||
    process.env.FRONTEND_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://localhost:3000'
  ).replace(/\/+$/, '');
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly resetTokens: IPasswordResetTokenRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(input: { email: string; locale?: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user || user.isBanned) {
      return { success: true };
    }

    const rawToken = randomBytes(RESET_TOKEN_BYTES).toString('base64url');
    const tokenHash = hashResetToken(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await this.resetTokens.markUserTokensUsed(user.id, now);
    await this.resetTokens.save(
      new PasswordResetToken(randomUUID(), user.id, tokenHash, expiresAt, now),
    );

    const locale = input.locale === 'en' ? 'en' : 'fr';
    const resetUrl = `${resolveWebAppUrl()}/${locale}/reset-password?token=${encodeURIComponent(rawToken)}`;

    await this.emailService.sendPasswordResetEmail({
      to: user.email,
      firstName: user.firstName,
      resetUrl,
      expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES,
    });

    return { success: true };
  }
}

export { hashResetToken };
