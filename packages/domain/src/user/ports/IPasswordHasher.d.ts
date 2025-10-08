export declare abstract class IPasswordHasher {
    static readonly token: unique symbol;
    static readonly [Symbol.toStringTag] = "IPasswordHasher";
}
export interface IPasswordHasher {
    hash(plain: string): Promise<string>;
    compare(plain: string, hash: string): Promise<boolean>;
}
