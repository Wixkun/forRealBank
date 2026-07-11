import { CreateGroupConversationUseCase } from '@forreal/application';
import {
  Conversation,
  ConversationType,
  ConversationParticipant,
  AdvisorClient,
  RoleName,
} from '@forreal/domain';
import type {
  IConversationRepository,
  IConversationParticipantRepository,
  IUserRepository,
  IAdvisorClientRepository,
} from '@forreal/domain';

const CREATOR = 'creator';

// Par défaut : le créateur est DIRECTOR (aucune restriction de périmètre).
const DIRECTOR_ROLES = [RoleName.DIRECTOR];

// Repo advisor→clients : `clientIds` = clients autorisés du créateur.
function advisorClientRepo(clientIds: string[]): IAdvisorClientRepository {
  return {
    listClientsOf: jest.fn(async (advisorId: string) =>
      clientIds.map((cid, i) => new AdvisorClient(`l${i}`, advisorId, cid, new Date())),
    ),
  } as unknown as IAdvisorClientRepository;
}

function conversationRepo(): { repo: IConversationRepository; created: string[] } {
  const created: string[] = [];
  const repo = {
    create: jest.fn(async (type: ConversationType, name?: string | null) => {
      created.push(name ?? '');
      return new Conversation('conv-new', type, new Date(), name ?? null);
    }),
  } as unknown as IConversationRepository;
  return { repo, created };
}

function participantRepo(): { repo: IConversationParticipantRepository; added: string[] } {
  const added: string[] = [];
  const repo = {
    addParticipantIfNotExists: jest.fn(async (conversationId: string, userId: string) => {
      added.push(userId);
      return {
        participant: new ConversationParticipant('p', conversationId, userId, new Date()),
        inserted: true,
      };
    }),
  } as unknown as IConversationParticipantRepository;
  return { repo, added };
}

function userRepo(users: Array<{ id: string; isBanned?: boolean }>): IUserRepository {
  return {
    findByIds: jest.fn(async (ids: string[]) =>
      ids
        .map((id) => users.find((u) => u.id === id))
        .filter(Boolean)
        .map((u) => ({ id: u!.id, isBanned: u!.isBanned ?? false })),
    ),
  } as unknown as IUserRepository;
}

describe('CreateGroupConversationUseCase', () => {
  it('creates a named group and adds creator + participants', async () => {
    const conv = conversationRepo();
    const part = participantRepo();
    const uc = new CreateGroupConversationUseCase(
      conv.repo,
      part.repo,
      userRepo([{ id: 'u1' }, { id: 'u2' }]),
      advisorClientRepo([]),
    );

    const res = await uc.execute({
      creatorId: CREATOR,
      creatorRoles: DIRECTOR_ROLES,
      name: '  Equipe  ',
      participantIds: ['u1', 'u2'],
    });

    expect(res.conversationId).toBe('conv-new');
    expect(res.name).toBe('Equipe'); // trimmé
    expect(conv.created).toEqual(['Equipe']);
    expect(part.added).toEqual([CREATOR, 'u1', 'u2']); // créateur ajouté d'office
  });

  it('rejects an empty name', async () => {
    const uc = new CreateGroupConversationUseCase(
      conversationRepo().repo,
      participantRepo().repo,
      userRepo([{ id: 'u1' }, { id: 'u2' }]),
      advisorClientRepo([]),
    );
    await expect(
      uc.execute({
        creatorId: CREATOR,
        creatorRoles: DIRECTOR_ROLES,
        name: '   ',
        participantIds: ['u1', 'u2'],
      }),
    ).rejects.toThrow(/INVALID_GROUP_NAME/);
  });

  it('rejects fewer than two other participants', async () => {
    const uc = new CreateGroupConversationUseCase(
      conversationRepo().repo,
      participantRepo().repo,
      userRepo([{ id: 'u1' }]),
      advisorClientRepo([]),
    );
    await expect(
      uc.execute({
        creatorId: CREATOR,
        creatorRoles: DIRECTOR_ROLES,
        name: 'G',
        participantIds: ['u1'],
      }),
    ).rejects.toThrow(/NOT_ENOUGH_PARTICIPANTS/);
  });

  it('rejects unknown or banned participants', async () => {
    const uc = new CreateGroupConversationUseCase(
      conversationRepo().repo,
      participantRepo().repo,
      userRepo([{ id: 'u1' }, { id: 'u2', isBanned: true }]),
      advisorClientRepo([]),
    );
    await expect(
      uc.execute({
        creatorId: CREATOR,
        creatorRoles: DIRECTOR_ROLES,
        name: 'G',
        participantIds: ['u1', 'u2'],
      }),
    ).rejects.toThrow(/INVALID_PARTICIPANT/);
  });

  it('deduplicates participants and ignores the creator in the list', async () => {
    const conv = conversationRepo();
    const part = participantRepo();
    const uc = new CreateGroupConversationUseCase(
      conv.repo,
      part.repo,
      userRepo([{ id: 'u1' }, { id: 'u2' }]),
      advisorClientRepo([]),
    );
    await uc.execute({
      creatorId: CREATOR,
      creatorRoles: DIRECTOR_ROLES,
      name: 'G',
      participantIds: ['u1', 'u1', 'u2', CREATOR],
    });
    expect(part.added).toEqual([CREATOR, 'u1', 'u2']);
  });

  it('lets an ADVISOR add only their own clients', async () => {
    const part = participantRepo();
    const uc = new CreateGroupConversationUseCase(
      conversationRepo().repo,
      part.repo,
      userRepo([{ id: 'client1' }, { id: 'client2' }]),
      advisorClientRepo(['client1', 'client2']), // clients du conseiller
    );
    await uc.execute({
      creatorId: CREATOR,
      creatorRoles: [RoleName.ADVISOR],
      name: 'Suivi',
      participantIds: ['client1', 'client2'],
    });
    expect(part.added).toEqual([CREATOR, 'client1', 'client2']);
  });

  it('forbids an ADVISOR from adding users who are not their clients', async () => {
    const uc = new CreateGroupConversationUseCase(
      conversationRepo().repo,
      participantRepo().repo,
      userRepo([{ id: 'client1' }, { id: 'stranger' }]),
      advisorClientRepo(['client1']), // seul client1 est lié au conseiller
    );
    await expect(
      uc.execute({
        creatorId: CREATOR,
        creatorRoles: [RoleName.ADVISOR],
        name: 'Suivi',
        participantIds: ['client1', 'stranger'],
      }),
    ).rejects.toThrow(/PARTICIPANT_NOT_ALLOWED/);
  });

  it('lets a DIRECTOR add anyone regardless of advisor links', async () => {
    const part = participantRepo();
    const uc = new CreateGroupConversationUseCase(
      conversationRepo().repo,
      part.repo,
      userRepo([{ id: 'anyone1' }, { id: 'anyone2' }]),
      advisorClientRepo([]), // aucun lien : sans effet pour un directeur
    );
    await uc.execute({
      creatorId: CREATOR,
      creatorRoles: [RoleName.DIRECTOR],
      name: 'Comité',
      participantIds: ['anyone1', 'anyone2'],
    });
    expect(part.added).toEqual([CREATOR, 'anyone1', 'anyone2']);
  });
});
