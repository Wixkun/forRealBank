import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import { ITwoFactorVerifier } from '@forreal/domain';

function resolveEncryptionMaterial(): string {
  const direct = process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (direct?.trim()) return direct.trim();

  const file = process.env.TWO_FACTOR_ENCRYPTION_KEY_FILE || process.env.JWT_SECRET_FILE;
  if (file) {
    try {
      const value = readFileSync(file, 'utf8').trim();
      if (value) return value;
    } catch {
      // The caller receives the explicit configuration error below.
    }
  }

  if (process.env.NODE_ENV !== 'production') return 'forrealbank-local-two-factor-key';
  throw new Error('Missing TWO_FACTOR_ENCRYPTION_KEY or JWT_SECRET for 2FA secret encryption');
}

@Injectable()
export class TwoFactorService implements ITwoFactorVerifier {
  private readonly encryptionKey = createHash('sha256')
    .update(`forrealbank:2fa:${resolveEncryptionMaterial()}`)
    .digest();

  generateSecret(): string {
    return generateSecret();
  }

  async createSetup(secret: string, email: string) {
    const otpauthUrl = generateURI({ issuer: 'ForRealBank', label: email, secret });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 240,
    });
    return { otpauthUrl, qrCodeDataUrl };
  }

  encrypt(secret: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), ciphertext]
      .map((value) => value.toString('base64url'))
      .join('.');
  }

  decrypt(encryptedSecret: string): string {
    const [ivPart, tagPart, ciphertextPart] = encryptedSecret.split('.');
    if (!ivPart || !tagPart || !ciphertextPart) throw new Error('INVALID_TWO_FACTOR_SECRET');

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(ivPart, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  async verify(encryptedSecret: string, token: string): Promise<boolean> {
    try {
      const normalizedToken = token.replace(/\s/g, '');
      if (!/^\d{6}$/.test(normalizedToken)) return false;
      const result = await verify({
        secret: this.decrypt(encryptedSecret),
        token: normalizedToken,
      });
      return result.valid;
    } catch {
      return false;
    }
  }
}
