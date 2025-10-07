import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/ports/IUserRepository';
import { IPasswordHasher } from '../../../domain/user/ports/IPasswordHasher';
import { ITokenService } from '../../../domain/user/ports/ITokenService';

type Input = { email: string; password: string };
type Output = { accessToken: string };

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly users: IUserRepository,
    @Inject(IPasswordHasher) private readonly hasher: IPasswordHasher,
    @Inject(ITokenService) private readonly tokens: ITokenService,
  ) {}

  async execute({ email, password }: Input): Promise<Output> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Identifiants invalides');

    const ok = await this.hasher.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Identifiants invalides');

    const accessToken = await this.tokens.sign({ sub: user.id, email: user.email });
    return { accessToken };
  }
}
