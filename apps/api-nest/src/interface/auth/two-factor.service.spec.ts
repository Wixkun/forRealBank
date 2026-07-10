jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'),
  generateURI: jest.fn(
    ({ issuer, label, secret }: { issuer: string; label: string; secret: string }) =>
      `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}`,
  ),
  verify: jest.fn(async ({ token }: { token: string }) => ({ valid: token === '123456' })),
}));

import { TwoFactorService } from './two-factor.service';

describe('TwoFactorService', () => {
  const service = new TwoFactorService();

  it('encrypts TOTP secrets and verifies a current code', async () => {
    const secret = service.generateSecret();
    const encryptedSecret = service.encrypt(secret);
    expect(encryptedSecret).not.toContain(secret);
    await expect(service.verify(encryptedSecret, '123456')).resolves.toBe(true);
    await expect(service.verify(encryptedSecret, '000000')).resolves.toBe(false);
  });

  it('creates a local QR code data URL', async () => {
    const secret = service.generateSecret();
    const setup = await service.createSetup(secret, 'client@forreal.bank');

    expect(setup.otpauthUrl).toMatch(/^otpauth:\/\/totp\//);
    expect(setup.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
