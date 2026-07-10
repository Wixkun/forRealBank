export interface ITwoFactorVerifier {
  verify(encryptedSecret: string, token: string): Promise<boolean>;
}

export const ITwoFactorVerifier = Symbol('ITwoFactorVerifier');
