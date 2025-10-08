import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null =>
          (req?.cookies?.['access_token'] as string | undefined) ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change-me-dev-only',
      issuer: process.env.JWT_ISSUER ?? 'forrealbank.auth',
      audience: process.env.JWT_AUDIENCE ?? 'forrealbank.api',
    });
  }

  async validate(payload: any) {
    return {
      sessionId: payload.sub,
      jti: payload.jti,
    };
  }
}
