import { IPasswordHasher, IPasswordResetTokenRepository, IUserRepository } from '@forreal/domain';
import { isStrongPassword } from '@forreal/domain';
import { hashResetToken } from './RequestPasswordResetUseCase';

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly resetTokens: IPasswordResetTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: { token: string; password: string }) {
    if (!input.token?.trim()) throw new Error('INVALID_RESET_TOKEN');
    if (!isStrongPassword(input.password)) throw new Error('WEAK_PASSWORD');

    const tokenHash = hashResetToken(input.token.trim());
    const resetToken = await this.resetTokens.findByHash(tokenHash);
    if (!resetToken?.isUsable()) throw new Error('INVALID_RESET_TOKEN');

    const user = await this.userRepository.findById(resetToken.userId);
    if (!user || user.isBanned) throw new Error('INVALID_RESET_TOKEN');

    const passwordHash = await this.passwordHasher.hash(input.password);
    user.changePassword(passwordHash);
    resetToken.markUsed();

    await this.userRepository.save(user);
    await this.resetTokens.save(resetToken);
    await this.resetTokens.markUserTokensUsed(user.id);

    return { success: true };
  }
}
