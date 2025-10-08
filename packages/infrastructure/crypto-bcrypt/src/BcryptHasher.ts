import { IPasswordHasher } from '@forreal/domain/user/ports/IPasswordHasher';
import bcrypt from 'bcryptjs';

export class BcryptHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  }
  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
