import { ChatGateway } from './chat.gateway';
import type { Socket } from 'socket.io';

// Teste la présence globale : un utilisateur est en ligne tant qu'au moins un
// de ses sockets est connecté (multi-onglets), et hors ligne à la fermeture du
// dernier. Le serveur et le bus sont remplacés par des stubs.
function makeGateway(): ChatGateway {
  const bus = { publish: jest.fn(), onMessage: jest.fn() };
  // La présence écrit last_seen_at à la connexion / fermeture du dernier
  // socket : stub pour ne pas toucher de base dans ces tests.
  const userRepository = { updateLastSeen: jest.fn(async () => undefined) };
  const gateway = new ChatGateway(
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never,
    userRepository as never,
    bus as never,
  );
  // Stub minimal du serveur socket.io (emit global + emit ciblé).
  (gateway as unknown as { server: Partial<Socket['server']> }).server = {
    emit: jest.fn(),
    to: jest.fn(() => ({ emit: jest.fn() })),
  } as never;
  return gateway;
}

function fakeSocket(id: string, userId: string): Socket {
  return {
    id,
    data: { userId },
    emit: jest.fn(),
  } as unknown as Socket;
}

describe('ChatGateway presence', () => {
  it('marks a user online while at least one socket is connected (multi-tab)', () => {
    const gateway = makeGateway();
    const tabA1 = fakeSocket('a1', 'userA');
    const tabA2 = fakeSocket('a2', 'userA');

    gateway.handleConnection(tabA1);
    gateway.handleConnection(tabA2);
    expect(gateway.isUserOnline('userA')).toBe(true);

    // Fermeture d'un seul onglet : toujours en ligne.
    gateway.handleDisconnect(tabA1);
    expect(gateway.isUserOnline('userA')).toBe(true);

    // Fermeture du dernier onglet : hors ligne.
    gateway.handleDisconnect(tabA2);
    expect(gateway.isUserOnline('userA')).toBe(false);
  });

  it('tracks several users independently', () => {
    const gateway = makeGateway();
    gateway.handleConnection(fakeSocket('a1', 'userA'));
    gateway.handleConnection(fakeSocket('b1', 'userB'));

    expect(gateway.isUserOnline('userA')).toBe(true);
    expect(gateway.isUserOnline('userB')).toBe(true);
    expect(gateway.isUserOnline('userC')).toBe(false);
    expect(Array.from(gateway.onlineUserIds()).sort()).toEqual(['userA', 'userB']);
  });

  it('considers users reported online by peer instances (multi-replica)', () => {
    const gateway = makeGateway();
    // Simule un heartbeat de présence globale reçu d'une autre instance.
    (gateway as unknown as { handleBusMessage: (m: unknown) => void }).handleBusMessage({
      type: 'global_presence',
      userIds: ['remoteUser'],
      senderInstanceId: 'other-instance',
    });
    expect(gateway.isUserOnline('remoteUser')).toBe(true);
  });
});
