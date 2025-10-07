import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/ports/IUserRepository';
import { IPasswordHasher } from '../../../domain/user/ports/IPasswordHasher';
import { User } from '../../../domain/user/User';
import { randomUUID } from 'crypto';

type Input = { email: string; password: string };
type Output = { id: string; email: string };

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly users: IUserRepository,
    @Inject(IPasswordHasher) private readonly hasher: IPasswordHasher,
  ) {}

  async execute({ email, password }: Input): Promise<Output> {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ConflictException('Email déjà utilisé');

    const hash = await this.hasher.hash(password);
    const now = new Date();
    const user = new User(randomUUID(), email, hash, now, now);

    const saved = await this.users.save(user);
    return { id: saved.id, email: saved.email };
  }
}
