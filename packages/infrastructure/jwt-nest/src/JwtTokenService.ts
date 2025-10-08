import { ITokenService, JwtPayload } from '@forreal/domain/user/ports/ITokenService';
import jwt, {
  SignOptions,
  VerifyOptions,
  TokenExpiredError,
  JsonWebTokenError,
} from 'jsonwebtoken';

type JwtAlgorithm = 'HS256' | 'RS256';

export interface JwtTokenOptions {
  secret: string | Buffer;
  publicKey?: string | Buffer;
  expiresIn?: SignOptions['expiresIn'];
  issuer?: string;
  audience?: string;
  notBefore?: SignOptions['notBefore'];
  clockTolerance?: number;
  algorithm?: JwtAlgorithm;
}

function parseDuration(
  input: unknown,
  fallback: SignOptions['expiresIn'],
): SignOptions['expiresIn'] {
  if (typeof input === 'number') return input;
  if (typeof input !== 'string' || input.trim() === '') return fallback;

  const n = Number(input);
  if (!Number.isNaN(n)) return n;
  return input as SignOptions['expiresIn'];
}

function normalizeAudience(aud?: string | string[]): string | undefined {
  if (!aud) return undefined;
  return Array.isArray(aud) ? aud[0] : aud;
}

export class JwtTokenService implements ITokenService {
  private readonly signOpts: SignOptions;
  private readonly verifyOpts: VerifyOptions;
  private readonly algorithm: JwtAlgorithm;
  private readonly secretOrPrivateKey: string | Buffer;
  private readonly publicKeyOrSecret: string | Buffer;

  constructor(opts: JwtTokenOptions = { secret: process.env.JWT_SECRET || 'default-secret' }) {
    this.algorithm = opts.algorithm ?? (process.env.JWT_ALGO as JwtAlgorithm) ?? 'HS256';

    this.secretOrPrivateKey = opts.secret;
    this.publicKeyOrSecret =
      this.algorithm === 'RS256' ? (opts.publicKey ?? opts.secret) : opts.secret;

    const issuer = opts.issuer ?? process.env.JWT_ISSUER ?? 'forrealbank.auth';
    const audienceRaw = opts.audience ?? process.env.JWT_AUDIENCE ?? 'forrealbank.api';

    const expiresIn = parseDuration(
      process.env.JWT_EXPIRES_IN ?? opts.expiresIn,
      '15m' as SignOptions['expiresIn'],
    );
    const notBefore = parseDuration(opts.notBefore ?? 0, 0 as SignOptions['notBefore']);

    this.signOpts = {
      expiresIn,
      issuer,
      audience: audienceRaw,
      notBefore,
      algorithm: this.algorithm,
    };

    this.verifyOpts = {
      algorithms: [this.algorithm],
      issuer,
      audience: normalizeAudience(audienceRaw),
      clockTolerance: opts.clockTolerance ?? 0,
    };
  }

  async sign(payload: JwtPayload): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(payload, this.secretOrPrivateKey, this.signOpts, (err, token) => {
        if (err || !token) return reject(err ?? new Error('JWT_SIGN_FAILED'));
        resolve(token);
      });
    });
  }

  async verify<T = unknown>(token: string): Promise<T> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.publicKeyOrSecret, this.verifyOpts, (err, decoded) => {
        if (err) {
          if (err instanceof TokenExpiredError) return reject(new Error('TOKEN_EXPIRED'));
          if (err instanceof JsonWebTokenError) return reject(new Error('INVALID_TOKEN'));
          return reject(err);
        }
        if (!decoded) return reject(new Error('INVALID_TOKEN'));
        resolve(decoded as T);
      });
    });
  }
}
