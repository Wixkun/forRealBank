import { Injectable } from '@nestjs/common';
import { ITokenService, JwtPayload } from '../../domain/user/ports/ITokenService';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(payload: JwtPayload): Promise<string> {
    return this.jwt.signAsync(payload);
  }

  async verify<T = unknown>(token: string): Promise<T> {
    const decoded = (await this.jwt.verifyAsync(token)) as unknown;
    return decoded as T;
  }
}
