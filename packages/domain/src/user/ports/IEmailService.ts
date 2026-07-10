export const IEmailService = Symbol('IEmailService');

export interface IEmailService {
  sendPasswordResetEmail(input: {
    to: string;
    firstName: string;
    resetUrl: string;
    expiresInMinutes: number;
  }): Promise<void>;
  sendEmailVerificationEmail(input: {
    to: string;
    firstName: string;
    verificationUrl: string;
    expiresInHours: number;
  }): Promise<void>;
}
