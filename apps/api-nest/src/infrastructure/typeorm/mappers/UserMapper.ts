import { User } from '../../../domain/user/User';
import { UserEntity } from '../entities/userEntity';

export class UserMapper {
  static toDomain(e: UserEntity): User {
    return new User(e.id, e.email, e.passwordHash, e.createdAt, e.updatedAt);
  }

  static toEntity(d: User): UserEntity {
    const e = new UserEntity();
    e.id = d.id;
    e.email = d.email;
    e.passwordHash = d.passwordHash;
    e.createdAt = d.createdAt;
    e.updatedAt = d.updatedAt;
    return e;
  }
}
