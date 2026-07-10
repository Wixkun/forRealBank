import { User } from '@forreal/domain';
import { RoleName } from '@forreal/domain';
import { UserEntity } from '../entities/UserEntity';

function isValidRoleName(name: string): name is RoleName {
  return (Object.values(RoleName) as string[]).includes(name);
}

export class UserMapper {
  static toPersistence(user: User): UserEntity {
    const entity = new UserEntity();

    entity.id = user.id;
    entity.email = user.email;
    entity.passwordHash = user.passwordHash;

    const firstName = (user as any)._firstName ?? (user as any).firstName ?? '';
    const lastName = (user as any)._lastName ?? (user as any).lastName ?? '';

    if (!String(firstName).trim() || !String(lastName).trim()) {
      throw new Error('[UserMapper.toPersistence] Le prénom et le nom sont obligatoires.');
    }

    entity.firstName = String(firstName).trim();
    entity.lastName = String(lastName).trim();

    entity.lastLoginAt = (user as any).lastLoginAt ?? null;
    entity.emailVerified = (user as any).emailVerified ?? false;
    entity.emailVerifiedAt = (user as any).emailVerifiedAt ?? null;
    entity.isBanned = (user as any).isBanned ?? false;
    entity.bannedAt = (user as any).bannedAt ?? null;
    entity.banReason = (user as any).banReason ?? null;

    entity.failedLoginCount = (user as any).failedLoginCount ?? 0;
    entity.lockUntil = (user as any).lockUntil ?? null;
    entity.twoFactorSecret = user.twoFactorSecret ?? null;
    entity.twoFactorEnabled = user.twoFactorEnabled;

    return entity;
  }

  static toDomain(entity: UserEntity): User {
    const roles: RoleName[] = (entity.roles ?? []).map((role) => role.name).filter(isValidRoleName);

    const user = new User(
      entity.id,
      entity.email,
      entity.passwordHash,
      new Set<RoleName>(roles),
      entity.createdAt,
      entity.updatedAt,
      entity.firstName,
      entity.lastName,
      entity.lastLoginAt ?? undefined,
      entity.emailVerified ?? false,
      entity.emailVerifiedAt ?? undefined,
      entity.isBanned ?? false,
      entity.bannedAt ?? undefined,
      entity.banReason ?? undefined,

      entity.failedLoginCount ?? 0,
      entity.lockUntil ?? undefined,
      entity.twoFactorSecret ?? undefined,
      entity.twoFactorEnabled ?? false,
    );

    Object.setPrototypeOf(user, User.prototype);

    return user;
  }
}
