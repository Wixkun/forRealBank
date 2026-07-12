import { CanUseConversationUseCase } from '@forreal/application';
import {
  AdvisorClient,
  Conversation,
  ConversationParticipant,
  ConversationType,
  RoleName,
} from '@forreal/domain';
import type {
  IAdvisorClientRepository,
  IConversationParticipantRepository,
  IConversationRepository,
  IUserRepository,
  User,
} from '@forreal/domain';

const ADVISOR = 'advisor-1';
const CLIENT = 'client-1';
const DIRECTOR = 'director-1';

function mkUser(id: string, roles: RoleName[]): User {
  return {
    id,
    firstName: id,
    lastName: 'User',
    roles: new Set(roles),
    isBanned: false,
  } as unknown as User;
}

function makeUseCase(options: {
  type: ConversationType;
  participantIds: string[];
  users: User[];
  advisorOfClient: string | null;
}) {
  const conversationRepo = {
    findById: jest.fn(async (id: string) => new Conversation(id, options.type, new Date(), null)),
  } as unknown as IConversationRepository;
  const participantRepo = {
    listByConversation: jest.fn(async (conversationId: string) =>
      options.participantIds.map(
        (userId, i) => new ConversationParticipant(`p${i}`, conversationId, userId, new Date()),
      ),
    ),
  } as unknown as IConversationParticipantRepository;
  const userRepo = {
    findByIds: jest.fn(async (ids: string[]) => options.users.filter((u) => ids.includes(u.id))),
  } as unknown as IUserRepository;
  const advisorClientRepo = {
    findAdvisorOf: jest.fn(async (clientId: string) =>
      options.advisorOfClient
        ? new AdvisorClient('l', options.advisorOfClient, clientId, new Date())
        : null,
    ),
  } as unknown as IAdvisorClientRepository;

  return new CanUseConversationUseCase(
    conversationRepo,
    participantRepo,
    userRepo,
    advisorClientRepo,
  );
}

describe('CanUseConversationUseCase — gel de la conversation advisor-client', () => {
  it('keeps an advisor-client conversation writable while the link exists', async () => {
    const uc = makeUseCase({
      type: ConversationType.PRIVATE,
      participantIds: [ADVISOR, CLIENT],
      users: [mkUser(ADVISOR, [RoleName.ADVISOR]), mkUser(CLIENT, [RoleName.CLIENT])],
      advisorOfClient: ADVISOR,
    });
    await expect(uc.isWritable('conv-1')).resolves.toBe(true);
  });

  it('locks the conversation once the client is assigned to another advisor', async () => {
    const uc = makeUseCase({
      type: ConversationType.PRIVATE,
      participantIds: [ADVISOR, CLIENT],
      users: [mkUser(ADVISOR, [RoleName.ADVISOR]), mkUser(CLIENT, [RoleName.CLIENT])],
      advisorOfClient: 'advisor-2',
    });
    await expect(uc.isWritable('conv-1')).resolves.toBe(false);
  });

  it('locks the conversation when the client has no advisor anymore', async () => {
    const uc = makeUseCase({
      type: ConversationType.PRIVATE,
      participantIds: [ADVISOR, CLIENT],
      users: [mkUser(ADVISOR, [RoleName.ADVISOR]), mkUser(CLIENT, [RoleName.CLIENT])],
      advisorOfClient: null,
    });
    await expect(uc.isWritable('conv-1')).resolves.toBe(false);
  });

  it('never locks group conversations', async () => {
    const uc = makeUseCase({
      type: ConversationType.GROUP,
      participantIds: [ADVISOR, CLIENT],
      users: [mkUser(ADVISOR, [RoleName.ADVISOR]), mkUser(CLIENT, [RoleName.CLIENT])],
      advisorOfClient: null,
    });
    await expect(uc.isWritable('conv-1')).resolves.toBe(true);
  });

  it('never locks director-client conversations (no assignment rule)', async () => {
    const uc = makeUseCase({
      type: ConversationType.PRIVATE,
      participantIds: [DIRECTOR, CLIENT],
      users: [mkUser(DIRECTOR, [RoleName.DIRECTOR]), mkUser(CLIENT, [RoleName.CLIENT])],
      advisorOfClient: null,
    });
    await expect(uc.isWritable('conv-1')).resolves.toBe(true);
  });

  it('never locks advisor-director conversations (ban requests channel)', async () => {
    const uc = makeUseCase({
      type: ConversationType.PRIVATE,
      participantIds: [ADVISOR, DIRECTOR],
      users: [mkUser(ADVISOR, [RoleName.ADVISOR]), mkUser(DIRECTOR, [RoleName.DIRECTOR])],
      advisorOfClient: null,
    });
    await expect(uc.isWritable('conv-1')).resolves.toBe(true);
  });
});
