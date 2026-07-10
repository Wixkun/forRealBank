import { createHash, randomBytes, randomUUID } from 'node:crypto';

export const EMAIL_VERIFICATION_TOKEN_BYTES = 32;
export const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

export function hashEmailVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function buildEmailVerificationUrl(rawToken: string, locale?: string): string {
  const resolvedLocale = locale === 'en' ? 'en' : 'fr';
  const baseUrl = (
    process.env.WEB_APP_URL?.trim() ||
    process.env.FRONTEND_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://localhost:3000'
  ).replace(/\/+$/, '');

  return `${baseUrl}/${resolvedLocale}/verify-email?token=${encodeURIComponent(rawToken)}`;
}

export function createRawEmailVerificationToken(): string {
  return randomBytes(EMAIL_VERIFICATION_TOKEN_BYTES).toString('base64url');
}

export function createEmailVerificationTokenId(): string {
  return randomUUID();
}
