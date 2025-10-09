import { User } from '../User';

export const IUserRepository = Symbol('IUserRepository');

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
  findById(id: string): Promise<User | null>;
  deleteById(id: string): Promise<void>;
  list(params?: { limit?: number; offset?: number; search?: string }): Promise<import('../User').User[]>;
  count(params?: { search?: string }): Promise<number>;
}
