import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { StrategyOptions } from 'passport-jwt';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '@forreal/domain/user/ports/ITokenService';

function cookieExtractor(req: Request & { cookies?: Record<string, string> }): string | null {
  return req?.cookies?.['access_token'] ?? null;
}

type JwtUser = { userId: string; email: string };

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
    const rec = payload as Partial<JwtPayload>;
    if (!rec?.sub || !rec?.email) {
      throw new UnauthorizedException('Token invalide');
    }
    return { userId: rec.sub, email: rec.email };
  }
}
