export interface JwtPayload {
  userId: string;
  sessionId: string;
  issuedAt: Date;
  expiresAt: Date;
  issuer: string;
  audience: string;
}

export interface ITokenService {
  sign(payload: JwtPayload): Promise<string>;
  verify(token: string): Promise<JwtPayload>;
}

export const ITokenService = Symbol('ITokenService');
