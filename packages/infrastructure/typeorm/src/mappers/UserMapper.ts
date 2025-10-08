import { User } from '@forreal/domain/user/User';
import { UserEntity } from '../entities/UserEntity';

export class UserMapper {
  static toEntity(u: User): UserEntity {
    const e = new UserEntity();
    e.id = u.id;
    e.email = u.email;
    e.passwordHash = u.passwordHash;
    e.name = u.name;
    e.createdAt = u.createdAt;
    return e;
  }

  static toDomain(e: UserEntity): User {
    return new User(e.id, e.email, e.passwordHash, e.name, e.createdAt);
  }
}
