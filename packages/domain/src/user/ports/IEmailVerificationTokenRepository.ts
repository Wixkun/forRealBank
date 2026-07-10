import { EmailVerificationToken } from '../EmailVerificationToken';

export const IEmailVerificationTokenRepository = Symbol('IEmailVerificationTokenRepository');

export interface IEmailVerificationTokenRepository {
  save(token: EmailVerificationToken): Promise<void>;
  findByHash(tokenHash: string): Promise<EmailVerificationToken | null>;
  markUserTokensUsed(userId: string, usedAt?: Date): Promise<void>;
}
