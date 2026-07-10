import { ChatGateway } from './chat.gateway';
import type { ITokenService, IUserRepository, JwtPayload, User } from '@forreal/domain';

// Teste uniquement la décision d'authentification du handshake WebSocket : le
// gateway ne doit jamais faire confiance à une identité fournie par le client.
function makeGateway(overrides: {
  verify?: ITokenService['verify'];
  findById?: IUserRepository['findById'];
}): ChatGateway {
  const tokenService = {
    sign: jest.fn(),
    verify: overrides.verify ?? jest.fn(),
  } as unknown as ITokenService;

  const userRepository = {
    findById: overrides.findById ?? jest.fn(),
  } as unknown as IUserRepository;

  // Les autres dépendances ne sont pas sollicitées par authenticate().
  return new ChatGateway(
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never,
    tokenService,
    userRepository,
    undefined as never,
  );
}

const validPayload: JwtPayload = {
  userId: 'user-1',
  sessionId: 'sess-1',
  issuedAt: new Date(),
  expiresAt: new Date(Date.now() + 60_000),
  issuer: 'forrealbank.auth',
  audience: 'forrealbank.api',
};

function fakeUser(partial: Partial<User> & { id: string }): User {
  return { id: partial.id, isBanned: partial.isBanned ?? false } as User;
}

describe('ChatGateway.authenticate', () => {
  it('accepts a valid token and returns the server-side user id', async () => {
    const gateway = makeGateway({
      verify: jest.fn().mockResolvedValue(validPayload),
      findById: jest.fn().mockResolvedValue(fakeUser({ id: 'user-1' })),
    });
    await expect(gateway.authenticate('valid-token')).resolves.toEqual({ userId: 'user-1' });
  });

  it('rejects a missing token', async () => {
    const gateway = makeGateway({});
    await expect(gateway.authenticate(null)).resolves.toEqual({ error: 'UNAUTHORIZED' });
  });

  it('rejects an invalid/expired token (verify throws)', async () => {
    const gateway = makeGateway({
      verify: jest.fn().mockRejectedValue(new Error('jwt expired')),
    });
    await expect(gateway.authenticate('bad-token')).resolves.toEqual({ error: 'UNAUTHORIZED' });
  });

  it('rejects when the user no longer exists', async () => {
    const gateway = makeGateway({
      verify: jest.fn().mockResolvedValue(validPayload),
      findById: jest.fn().mockResolvedValue(null),
    });
    await expect(gateway.authenticate('valid-token')).resolves.toEqual({ error: 'UNAUTHORIZED' });
  });

  it('forbids a banned user', async () => {
    const gateway = makeGateway({
      verify: jest.fn().mockResolvedValue(validPayload),
      findById: jest.fn().mockResolvedValue(fakeUser({ id: 'user-1', isBanned: true })),
    });
    await expect(gateway.authenticate('valid-token')).resolves.toEqual({ error: 'FORBIDDEN' });
  });
});
