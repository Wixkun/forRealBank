export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface ITokenService {
  sign(payload: JwtPayload): Promise<string>;
  verify<T = unknown>(token: string): Promise<T>;
}

export const ITokenService = Symbol('ITokenService');
