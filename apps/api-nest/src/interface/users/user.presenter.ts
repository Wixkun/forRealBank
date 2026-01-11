import { User } from '@forreal/domain';

export interface UserResponseDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  createdAt: Date;
  lastLoginAt?: Date;
  isBanned?: boolean;
  bannedAt?: Date;
  banReason?: string;
}

export class UserPresenter {
  static toDTO(user: User): UserResponseDTO {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: Array.from(user.roles),
      lastLoginAt: user.lastLoginAt,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
    };
  }

  static toListDTO(users: User[]): UserResponseDTO[] {
    return users.map(user => this.toDTO(user));
  }

  static toDetailDTO(user: User): UserResponseDTO {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: Array.from(user.roles),
      lastLoginAt: user.lastLoginAt,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      bannedAt: user.bannedAt,
      banReason: user.banReason,
    };
  }
}
