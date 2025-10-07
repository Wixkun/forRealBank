import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, type StrategyOptions } from 'passport-jwt';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';

function parseCookie(header?: string): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const eq = p.indexOf('=');
        const key = eq === -1 ? p : p.slice(0, eq);
        const val = eq === -1 ? '' : p.slice(eq + 1);
        return [decodeURIComponent(key), decodeURIComponent(val)];
      }),
  );
}

function cookieExtractor(req: Request): string | null {
  const cookies = parseCookie(req.headers?.cookie);
  return cookies['access_token'] ?? null;
}

type JwtPayload = { sub: string; email: string };
type JwtUser = { userId: string; email: string };

function isJwtPayload(input: unknown): input is JwtPayload {
  if (typeof input !== 'object' || input === null) return false;
  const rec = input as Record<string, unknown>;
  return typeof rec.sub === 'string' && typeof rec.email === 'string';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    };
    super(opts);
  }

  validate(payload: unknown): JwtUser {
    if (!isJwtPayload(payload)) {
      throw new UnauthorizedException('Token JWT invalide');
    }
    return { userId: payload.sub, email: payload.email };
  }
}
