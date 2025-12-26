/**
 * JWT Payload Structure
 * Contains all information encoded in a JWT token
 * @interface JwtPayload
 */
export interface JwtPayload {
  /** User's unique identifier */
  userId: string;
  /** Session unique identifier */
  sessionId: string;
  /** Timestamp when the token was issued */
  issuedAt: Date;
  /** Timestamp when the token expires */
  expiresAt: Date;
  /** Token issuer identifier */
  issuer: string;
  /** Token audience identifier */
  audience: string;
}

/**
 * Token Service Interface
 * Defines the contract for JWT token creation and verification
 * @interface ITokenService
 */
export interface ITokenService {
  /**
   * Create and sign a JWT token with the provided payload
   * @param payload - The payload data to encode in the token
   * @returns Promise containing the signed JWT token string
   */
  sign(payload: JwtPayload): Promise<string>;

  /**
   * Verify and decode a JWT token
   * @param token - The JWT token string to verify
   * @returns Promise containing the decoded payload if valid
   * @throws Error if token is invalid or expired
   */
  verify(token: string): Promise<JwtPayload>;
}

export const ITokenService = Symbol('ITokenService');
