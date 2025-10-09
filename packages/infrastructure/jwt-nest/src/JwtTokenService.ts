import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { JwtPayload, ITokenService } from '@forreal/domain/user/ports/ITokenService';

export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly signOpts: SignOptions;
  private readonly verifyOpts: VerifyOptions;

  constructor() {
    this.secret = process.env.JWT_SECRET ?? 'dev-secret';
    if (!this.secret) {
      throw new Error('[JwtTokenService] Missing JWT_SECRET in environment variables');
    }

    this.signOpts = {}
    this.verifyOpts = { algorithms: ['HS256'] };
  }

  private toJwtStandard(payload: JwtPayload): Record<string, any> {
    return {
      sub: payload.userId,
      jti: payload.sessionId,
      iss: payload.issuer,
      aud: payload.audience,
      iat: Math.floor(payload.issuedAt.getTime() / 1000),
      exp: Math.floor(payload.expiresAt.getTime() / 1000),
    };
  }

  private fromJwtStandard(decoded: any): JwtPayload {
    return {
      userId: decoded.sub,
      sessionId: decoded.jti,
      issuedAt: new Date(decoded.iat * 1000),
      expiresAt: new Date(decoded.exp * 1000),
      issuer: decoded.iss,
      audience: decoded.aud,
    };
  }

  async sign(payload: JwtPayload): Promise<string> {
    const jwtPayload = this.toJwtStandard(payload);

    return new Promise((resolve, reject) => {
      jwt.sign(jwtPayload, this.secret, this.signOpts, (err, token) => {
        if (err || !token) return reject(err ?? new Error('JWT_SIGN_FAILED'));
        resolve(token);
      });
    });
  }

  async verify(token: string): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret, this.verifyOpts, (err, decoded) => {
        if (err || !decoded) return reject(err);
        resolve(this.fromJwtStandard(decoded));
      });
    });
  }
}
