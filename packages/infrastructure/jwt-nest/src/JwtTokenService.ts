import { ITokenService, JwtPayload } from '@forreal/domain/user/ports/ITokenService';
import jwt, { JwtPayload as LibJwtPayload, Secret, SignOptions } from 'jsonwebtoken';

export class JwtTokenService implements ITokenService {
  private readonly secret: Secret = process.env.JWT_SECRET || 'default-secret';
  private readonly expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as unknown as SignOptions['expiresIn'];

  async sign(payload: JwtPayload): Promise<string> {
    const options: SignOptions = { expiresIn: this.expiresIn };

    return new Promise((resolve, reject) => {
      jwt.sign(payload, this.secret, options, (err: Error | null, token?: string) => {
        if (err || !token) return reject(err);
        resolve(token);
      });
    });
  }

  async verify<T = unknown>(token: string): Promise<T> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret, (err: Error | null, decoded?: unknown) => {
        if (err || !decoded) return reject(new Error('INVALID_TOKEN'));
        resolve(decoded as T);
      });
    });
  }
}
