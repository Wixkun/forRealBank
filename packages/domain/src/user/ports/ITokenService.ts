export interface JwtPayload {
  sub: string;
  jti: string;
  iat?: number;
  exp?: number;
  nbf?: number;
  iss?: string;
  aud?: string;
}

export interface ITokenService {
  sign(payload: JwtPayload): Promise<string>;
  verify<T = unknown>(token: string): Promise<T>;
}

export const ITokenService = Symbol('ITokenService');
