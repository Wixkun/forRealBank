import { User } from '../User';
export declare abstract class IUserRepository {
    static readonly token: unique symbol;
    static readonly [Symbol.toStringTag] = "IUserRepository";
}
export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    save(user: User): Promise<void>;
    existsByEmail(email: string): Promise<boolean>;
}
