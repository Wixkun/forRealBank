export declare class User {
    readonly id: string;
    readonly email: string;
    readonly passwordHash: string;
    readonly name: string | null;
    readonly createdAt: Date;
    constructor(id: string, email: string, passwordHash: string, name: string | null, createdAt: Date);
}
