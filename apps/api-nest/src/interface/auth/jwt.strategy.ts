import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { resolveEnvSecret } from '@forreal/infrastructure-jwt-nest';

const cookieExtractor = (req: Request): string | null =>
  (req?.cookies?.['access_token'] as string | undefined) ?? null;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: resolveEnvSecret('JWT_SECRET') ?? 'fallback',
      issuer: process.env.JWT_ISSUER ?? 'forrealbank.auth',
      audience: process.env.JWT_AUDIENCE ?? 'forrealbank.api',
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      sessionId: payload.jti,
      jti: payload.jti,
    };
  }
}
