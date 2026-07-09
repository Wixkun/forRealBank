export const IEmailService = Symbol('IEmailService');

export interface IEmailService {
  sendPasswordResetEmail(input: {
    to: string;
    firstName: string;
    resetUrl: string;
    expiresInMinutes: number;
  }): Promise<void>;
}
