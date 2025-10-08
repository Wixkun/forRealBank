export abstract class IPasswordHasher {
  static readonly token = Symbol('IPasswordHasher');
  public static readonly [Symbol.toStringTag] = 'IPasswordHasher';
}

export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
