import { OpenPrivateConversationUseCase, ListContactableUsersUseCase } from '@forreal/application';
import { Conversation, ConversationParticipant, ConversationType, RoleName } from '@forreal/domain';
import type {
  IConversationParticipantRepository,
  IConversationRepository,
  IConversationUserStateRepository,
  IUserRepository,
  User,
} from '@forreal/domain';

const REQUESTER = 'alice';
const TARGET = 'bob';

function mkUser(id: string, isBanned = false): User {
  return {
    id,
    firstName: id,
    lastName: 'User',
    roles: new Set([RoleName.CLIENT]),
    isBanned,
  } as unknown as User;
}

function userRepo(users: User[]): IUserRepository {
  return {
    findById: jest.fn(async (id: string) => users.find((u) => u.id === id) ?? null),
  } as unknown as IUserRepository;
}

// Stub d'autorisation : la logique métier détaillée est testée dans
// list-contactable-users.usecase.spec.ts.
function contactable(allowed: boolean): ListContactableUsersUseCase {
  return {
    isContactAllowed: jest.fn(async () => allowed),
  } as unknown as ListContactableUsersUseCase;
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

function stateRepo(): { repo: IConversationUserStateRepository; setHidden: jest.Mock } {
  const setHidden = jest.fn(async () => undefined);
  return { repo: { setHidden } as unknown as IConversationUserStateRepository, setHidden };
}

function conversation(id: string): Conversation {
  return new Conversation(id, ConversationType.PRIVATE, new Date(), null);
}

// findPrivateBetween renvoie successivement les valeurs fournies (simule la
// re-vérification post-création du chemin concurrent).
function conversationRepo(findResults: Array<Conversation | null>) {
  const deleted: string[] = [];
  let call = 0;
  const create = jest.fn(async () => conversation('conv-new'));
  const repo = {
    findPrivateBetween: jest.fn(async () => findResults[Math.min(call++, findResults.length - 1)]),
    create,
    deleteById: jest.fn(async (id: string) => {
      deleted.push(id);
    }),
  } as unknown as IConversationRepository;
  return { repo, deleted, create };
}

describe('OpenPrivateConversationUseCase', () => {
  it('rejects a target outside the allowed business scope (no API bypass)', async () => {
    const conv = conversationRepo([null]);
    const part = participantRepo();
    const state = stateRepo();
    const uc = new OpenPrivateConversationUseCase(
      conv.repo,
      part.repo,
      userRepo([mkUser(TARGET)]),
      state.repo,
      contactable(false),
    );

    await expect(
      uc.execute({
        requesterId: REQUESTER,
        requesterRoles: [RoleName.ADVISOR],
        targetUserId: TARGET,
      }),
    ).rejects.toThrow('CONTACT_NOT_ALLOWED');
    expect(part.added).toEqual([]);
  });

  it('rejects self, unknown and banned targets', async () => {
    const conv = conversationRepo([null]);
    const uc = new OpenPrivateConversationUseCase(
      conv.repo,
      participantRepo().repo,
      userRepo([mkUser(TARGET, true)]),
      stateRepo().repo,
      contactable(true),
    );

    await expect(
      uc.execute({ requesterId: REQUESTER, requesterRoles: [], targetUserId: REQUESTER }),
    ).rejects.toThrow('INVALID_TARGET');
    await expect(
      uc.execute({ requesterId: REQUESTER, requesterRoles: [], targetUserId: 'ghost' }),
    ).rejects.toThrow('INVALID_TARGET');
    await expect(
      uc.execute({ requesterId: REQUESTER, requesterRoles: [], targetUserId: TARGET }),
    ).rejects.toThrow('INVALID_TARGET');
  });

  it('returns the existing conversation, unhides it for the requester only and creates nothing', async () => {
    const existing = conversation('conv-existing');
    const conv = conversationRepo([existing]);
    const part = participantRepo();
    const state = stateRepo();
    const uc = new OpenPrivateConversationUseCase(
      conv.repo,
      part.repo,
      userRepo([mkUser(TARGET)]),
      state.repo,
      contactable(true),
    );

    const res = await uc.execute({
      requesterId: REQUESTER,
      requesterRoles: [RoleName.ADVISOR],
      targetUserId: TARGET,
    });

    expect(res).toEqual({ conversationId: 'conv-existing', created: false });
    expect(conv.create).not.toHaveBeenCalled();
    expect(part.added).toEqual([]);
    // Démasquage limité au demandeur : la visibilité des autres est intacte.
    expect(state.setHidden).toHaveBeenCalledTimes(1);
    expect(state.setHidden).toHaveBeenCalledWith(REQUESTER, 'conv-existing', false);
  });

  it('creates the conversation with both participants when none exists', async () => {
    const created = conversation('conv-new');
    const conv = conversationRepo([null, created]);
    const part = participantRepo();
    const uc = new OpenPrivateConversationUseCase(
      conv.repo,
      part.repo,
      userRepo([mkUser(TARGET)]),
      stateRepo().repo,
      contactable(true),
    );

    const res = await uc.execute({
      requesterId: REQUESTER,
      requesterRoles: [RoleName.ADVISOR],
      targetUserId: TARGET,
    });

    expect(res).toEqual({ conversationId: 'conv-new', created: true });
    expect(part.added).toEqual([REQUESTER, TARGET]);
    expect(conv.deleted).toEqual([]);
  });

  it('converges to the earliest conversation when concurrent requests both created one', async () => {
    // Première vérification : rien. Après création : une conversation plus
    // ancienne (créée par la requête concurrente) est devenue visible.
    const canonical = conversation('conv-canonical');
    const conv = conversationRepo([null, canonical]);
    const part = participantRepo();
    const state = stateRepo();
    const uc = new OpenPrivateConversationUseCase(
      conv.repo,
      part.repo,
      userRepo([mkUser(TARGET)]),
      state.repo,
      contactable(true),
    );

    const res = await uc.execute({
      requesterId: REQUESTER,
      requesterRoles: [RoleName.ADVISOR],
      targetUserId: TARGET,
    });

    expect(res).toEqual({ conversationId: 'conv-canonical', created: false });
    expect(conv.deleted).toEqual(['conv-new']);
  });
});
