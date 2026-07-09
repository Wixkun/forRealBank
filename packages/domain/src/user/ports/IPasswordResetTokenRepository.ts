import { PasswordResetToken } from '../PasswordResetToken';

export const IPasswordResetTokenRepository = Symbol('IPasswordResetTokenRepository');

export interface IPasswordResetTokenRepository {
  save(token: PasswordResetToken): Promise<void>;
  findByHash(tokenHash: string): Promise<PasswordResetToken | null>;
  markUserTokensUsed(userId: string, usedAt?: Date): Promise<void>;
}
