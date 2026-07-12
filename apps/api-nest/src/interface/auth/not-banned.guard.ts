import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Bloque les utilisateurs bannis sur les opérations sensibles (virements,
 * trading…) : le JWT peut rester techniquement valide quelques minutes après
 * un bannissement, ce guard revérifie l'état en base à chaque requête.
 * À placer APRÈS JwtAuthGuard (il lit l'identité déjà vérifiée).
 */
@Injectable()
export class NotBannedGuard implements CanActivate {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.id ?? req.auth?.userId;
    if (!userId) return true; // pas d'identité : JwtAuthGuard a déjà tranché

    const rows: Array<{ is_banned: boolean }> = await this.dataSource.query(
      `SELECT is_banned FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );
    if (rows[0]?.is_banned) {
      throw new ForbiddenException('Account banned');
    }
    return true;
  }
}
