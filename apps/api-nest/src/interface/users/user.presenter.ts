import { User } from '@forreal/domain/user/User';

/**
 * User Response DTO
 * Standardized structure for user data returned in API responses
 * @interface UserResponseDTO
 */
export interface UserResponseDTO {
  /** User's unique identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Array of role names assigned to the user */
  roles: string[];
  /** Timestamp of user creation */
  createdAt: Date;
  /** Timestamp of user's last login (optional) */
  lastLoginAt?: Date;
  /** Whether the user is banned */
  isBanned?: boolean;
  /** Timestamp when user was banned (optional) */
  bannedAt?: Date;
  /** Reason for banning the user (optional) */
  banReason?: string;
}

/**
 * User Presenter
 * Centralized service for converting User domain entities to DTOs
 * Ensures consistent response formatting across all endpoints
 * @class UserPresenter
 */
export class UserPresenter {
  /**
   * Convert a single User entity to a basic DTO
   * @param user - The User entity to convert
   * @returns UserResponseDTO with basic user information
   */
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

  /**
   * Convert multiple User entities to DTOs
   * @param users - Array of User entities to convert
   * @returns Array of UserResponseDTOs
   */
  static toListDTO(users: User[]): UserResponseDTO[] {
    return users.map(user => this.toDTO(user));
  }

  /**
   * Convert a single User entity to a detailed DTO including ban information
   * @param user - The User entity to convert
   * @returns UserResponseDTO with all available information including ban details
   */
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
