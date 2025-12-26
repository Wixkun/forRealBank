import { User } from '../User';

export const IUserRepository = Symbol('IUserRepository');

/**
 * User Repository Interface
 * Defines the contract for user data persistence operations
 * @interface IUserRepository
 */
export interface IUserRepository {
  /**
   * Find a user by email address
   * @param email - The email address to search for
   * @returns Promise containing the user or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Persist a user entity to the repository
   * @param user - The user entity to save
   * @returns Promise that resolves when save is complete
   */
  save(user: User): Promise<void>;

  /**
   * Check if a user exists with the given email
   * @param email - The email address to check
   * @returns Promise containing true if email exists, false otherwise
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Find a user by their unique identifier
   * @param id - The user ID
   * @returns Promise containing the user or null if not found
   */
  findById(id: string): Promise<User | null>;

  /**
   * Delete a user by their unique identifier
   * @param id - The user ID to delete
   * @returns Promise that resolves when deletion is complete
   */
  deleteById(id: string): Promise<void>;

  /**
   * List users with optional pagination and search
   * @param params - Optional parameters for limit, offset, and search
   * @returns Promise containing array of users
   */
  list(params?: { limit?: number; offset?: number; search?: string }): Promise<import('../User').User[]>;

  /**
   * Count total users matching optional search criteria
   * @param params - Optional search parameters
   * @returns Promise containing the count of matching users
   */
  count(params?: { search?: string }): Promise<number>;
}
