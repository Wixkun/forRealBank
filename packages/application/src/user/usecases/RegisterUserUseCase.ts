import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { IPasswordHasher } from '@forreal/domain/user/ports/IPasswordHasher';
import { User } from '@forreal/domain/user/User';
import { RoleName } from '@forreal/domain/user/RoleName';
import { randomUUID } from 'crypto';

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: { email: string; password: string; firstName: string; lastName: string }) {
    const emailAlreadyUsed = await this.userRepository.existsByEmail(input.email);
    if (emailAlreadyUsed) throw new Error('EMAIL_ALREADY_REGISTERED');

    const firstName = (input.firstName ?? '').replace(/\s+/g, ' ').trim();
    const lastName = (input.lastName ?? '').replace(/\s+/g, ' ').trim();
    if (!firstName || !lastName) throw new Error('INVALID_FULL_NAME');

    const userId = randomUUID();
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
      undefined,
    );

    await this.userRepository.save(newUser);
    return { success: true };
  }
}
