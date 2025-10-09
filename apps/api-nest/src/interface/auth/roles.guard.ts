import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { RoleName } from '@forreal/domain/user/RoleName';
import { ITokenService, ITokenService as ITokenServiceToken } from '@forreal/domain/user/ports/ITokenService';
import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    @Inject(ITokenServiceToken)
    private readonly tokens: ITokenService,

    @Inject(IUserRepository)
    private readonly users: IUserRepository,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.['access_token'];
    if (!token) throw new UnauthorizedException('Missing access token');

    const decoded = await this.tokens.verify(token).catch(() => null);
    if (!decoded) throw new UnauthorizedException('Invalid or expired token');

    const user = await this.users.findById(decoded.userId);
    if (!user) throw new UnauthorizedException('User not found');
    if (user.isBanned) throw new ForbiddenException('Account banned');

    const userRoles = Array.from(user.roles);
    (req as any).auth = {
      userId: user.id,
      roles: userRoles,
      issuedAt: decoded.issuedAt,
      expiresAt: decoded.expiresAt,
    };

    const required = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (required && required.length > 0) {
      const has = required.some((r) => userRoles.includes(r));
      if (!has) throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
