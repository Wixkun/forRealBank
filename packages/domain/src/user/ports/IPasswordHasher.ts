export abstract class IPasswordHasher {
  static readonly token = Symbol('IPasswordHasher');
  public static readonly [Symbol.toStringTag] = 'IPasswordHasher';
}

/**
 * Password Hasher Interface
 * Defines the contract for password hashing and verification operations
 * @interface IPasswordHasher
 */
export interface IPasswordHasher {
  /**
   * Hash a plain text password
   * @param plain - The plain text password to hash
   * @returns Promise containing the hashed password
   */
  hash(plain: string): Promise<string>;

  /**
   * Compare a plain text password with a hashed password
   * @param plain - The plain text password to verify
   * @param hash - The hashed password to compare against
   * @returns Promise containing true if passwords match, false otherwise
   */
  compare(plain: string, hash: string): Promise<boolean>;
}
