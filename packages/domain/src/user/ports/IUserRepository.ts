import { User } from '../User';

export abstract class IUserRepository {
  static readonly token = Symbol('IUserRepository');
  public static readonly [Symbol.toStringTag] = 'IUserRepository';
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
}