import { Injectable } from '@nestjs/common';
import { IPasswordHasher } from '../../domain/user/ports/IPasswordHasher';
import bcrypt from 'bcryptjs';

@Injectable()
export class BcryptHasher implements IPasswordHasher {
  private readonly rounds = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
