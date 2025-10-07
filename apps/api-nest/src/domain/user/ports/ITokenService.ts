export type JwtPayload = { sub: string; email: string };

export abstract class ITokenService {
  abstract sign(payload: JwtPayload): Promise<string>;
  abstract verify<T = unknown>(token: string): Promise<T>;
}
