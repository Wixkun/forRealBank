import { resolveJwtSecret, TEST_JWT_SECRET } from '@forreal/infrastructure-jwt-nest';

// Ces tests manipulent process.env.NODE_ENV et JWT_SECRET : on les restaure
// systématiquement pour éviter toute dépendance à l'ordre d'exécution.
describe('resolveJwtSecret', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.JWT_SECRET;
    delete process.env.JWT_SECRET_FILE;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns the explicitly provided secret (trimmed)', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = '  super-secret-value  ';
    expect(resolveJwtSecret()).toBe('super-secret-value');
  });

  it('falls back to the fixed test secret only when NODE_ENV=test and no secret is set', () => {
    process.env.NODE_ENV = 'test';
    expect(resolveJwtSecret()).toBe(TEST_JWT_SECRET);
  });

  it('prefers an explicit secret over the test fallback', () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'explicit-test-secret';
    expect(resolveJwtSecret()).toBe('explicit-test-secret');
  });

  it('throws when the secret is missing in development', () => {
    process.env.NODE_ENV = 'development';
    expect(() => resolveJwtSecret()).toThrow(/JWT_SECRET is required/);
  });

  it('throws when the secret is missing in staging', () => {
    process.env.NODE_ENV = 'staging';
    expect(() => resolveJwtSecret()).toThrow(/JWT_SECRET is required/);
  });

  it('throws when the secret is missing in production', () => {
    process.env.NODE_ENV = 'production';
    expect(() => resolveJwtSecret()).toThrow(/JWT_SECRET is required/);
  });

  it('throws when NODE_ENV is undefined and no secret is set', () => {
    delete process.env.NODE_ENV;
    expect(() => resolveJwtSecret()).toThrow(/JWT_SECRET is required/);
  });

  it('rejects an empty secret in a non-test environment', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = '';
    expect(() => resolveJwtSecret()).toThrow(/JWT_SECRET is required/);
  });

  it('rejects a whitespace-only secret in a non-test environment', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = '     ';
    expect(() => resolveJwtSecret()).toThrow(/JWT_SECRET is required/);
  });

  it('never includes the secret value in the thrown error message', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = '';
    try {
      resolveJwtSecret();
      fail('expected resolveJwtSecret to throw');
    } catch (error) {
      expect((error as Error).message).not.toContain('JWT_SECRET=');
    }
  });
});
