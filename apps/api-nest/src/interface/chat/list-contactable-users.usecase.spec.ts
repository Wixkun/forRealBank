import { ListContactableUsersUseCase } from '@forreal/application';
import { AdvisorClient, RoleName } from '@forreal/domain';
import type { IAdvisorClientRepository, IUserRepository, User } from '@forreal/domain';

// Utilisateur minimal (cast) : seuls les champs lus par le use case comptent.
function mkUser(
  id: string,
  firstName: string,
  lastName: string,
  roles: RoleName[],
  isBanned = false,
): User {
  return { id, firstName, lastName, roles: new Set(roles), isBanned } as unknown as User;
}

// advisorId -> clientIds et clientId -> advisorId (relation en base, jamais déduite).
function advisorClientRepo(links: Array<{ advisorId: string; clientId: string }>) {
  return {
    listClientsOf: jest.fn(async (advisorId: string) =>
      links
        .filter((l) => l.advisorId === advisorId)
        .map((l, i) => new AdvisorClient(`l${i}`, l.advisorId, l.clientId, new Date())),
    ),
    findAdvisorOf: jest.fn(async (clientId: string) => {
      const link = links.find((l) => l.clientId === clientId);
      return link ? new AdvisorClient('l', link.advisorId, link.clientId, new Date()) : null;
    }),
  } as unknown as IAdvisorClientRepository;
}

function userRepo(users: User[]): IUserRepository {
  return {
    list: jest.fn(async () => users),
    findByIds: jest.fn(async (ids: string[]) => users.filter((u) => ids.includes(u.id))),
    findById: jest.fn(async (id: string) => users.find((u) => u.id === id) ?? null),
  } as unknown as IUserRepository;
}

const alice = mkUser('alice', 'Alice', 'Advisor', [RoleName.ADVISOR]);
const arnold = mkUser('arnold', 'Arnold', 'Advisor', [RoleName.ADVISOR]);
const bob = mkUser('bob', 'Bob', 'Client', [RoleName.CLIENT]);
const charlie = mkUser('charlie', 'Charlie', 'Client', [RoleName.CLIENT]);
const diane = mkUser('diane', 'Diane', 'Director', [RoleName.DIRECTOR]);
const admin = mkUser('admin', 'Ada', 'Admin', [RoleName.ADMIN]);

const ALL = [alice, arnold, bob, charlie, diane, admin];
// bob → alice ; charlie → arnold (chacun son conseiller).
const LINKS = [
  { advisorId: 'alice', clientId: 'bob' },
  { advisorId: 'arnold', clientId: 'charlie' },
];

function makeUseCase(users: User[] = ALL, links = LINKS) {
  return new ListContactableUsersUseCase(advisorClientRepo(links), userRepo(users));
}

describe('ListContactableUsersUseCase', () => {
  it('advisor sees their own clients plus the staff (other advisors, directors)', async () => {
    const uc = makeUseCase();
    const res = await uc.execute({ requesterId: 'alice', requesterRoles: [RoleName.ADVISOR] });
    expect(res.map((u) => u.id).sort()).toEqual(['arnold', 'bob', 'diane']);
  });

  it("advisor never sees another advisor's clients nor admins", async () => {
    const uc = makeUseCase();
    const res = await uc.execute({ requesterId: 'alice', requesterRoles: [RoleName.ADVISOR] });
    expect(res.some((u) => u.id === 'charlie')).toBe(false);
    expect(res.some((u) => u.id === 'admin')).toBe(false);
  });

  it('client only sees their assigned advisor', async () => {
    const uc = makeUseCase();
    const res = await uc.execute({ requesterId: 'bob', requesterRoles: [RoleName.CLIENT] });
    expect(res.map((u) => u.id)).toEqual(['alice']);
  });

  it('director sees all clients and advisors (not admins)', async () => {
    const uc = makeUseCase();
    const res = await uc.execute({ requesterId: 'diane', requesterRoles: [RoleName.DIRECTOR] });
    expect(res.map((u) => u.id).sort()).toEqual(['alice', 'arnold', 'bob', 'charlie']);
  });

  it('admin has no private-conversation directory (current business rules)', async () => {
    const uc = makeUseCase();
    const res = await uc.execute({ requesterId: 'admin', requesterRoles: [RoleName.ADMIN] });
    expect(res).toEqual([]);
  });

  it('excludes banned users', async () => {
    const bannedBob = mkUser('bob', 'Bob', 'Client', [RoleName.CLIENT], true);
    const uc = makeUseCase([alice, bannedBob], LINKS);
    const res = await uc.execute({ requesterId: 'alice', requesterRoles: [RoleName.ADVISOR] });
    expect(res).toEqual([]);
  });

  describe('search', () => {
    it('matches a partial first name, case-insensitive with surrounding spaces', async () => {
      const uc = makeUseCase();
      const res = await uc.execute({
        requesterId: 'diane',
        requesterRoles: [RoleName.DIRECTOR],
        search: '  ALI ',
      });
      expect(res.map((u) => u.id)).toEqual(['alice']);
    });

    it('matches the combined "first last" name', async () => {
      const uc = makeUseCase();
      const res = await uc.execute({
        requesterId: 'diane',
        requesterRoles: [RoleName.DIRECTOR],
        search: 'bob cli',
      });
      expect(res.map((u) => u.id)).toEqual(['bob']);
    });

    it('search only covers the allowed scope of the requester', async () => {
      const uc = makeUseCase();
      // Charlie existe mais appartient à un autre conseiller : introuvable.
      const res = await uc.execute({
        requesterId: 'alice',
        requesterRoles: [RoleName.ADVISOR],
        search: 'charlie',
      });
      expect(res).toEqual([]);
    });

    it('returns everyone allowed when the search is blank', async () => {
      const uc = makeUseCase();
      const res = await uc.execute({
        requesterId: 'alice',
        requesterRoles: [RoleName.ADVISOR],
        search: '   ',
      });
      expect(res.map((u) => u.id).sort()).toEqual(['arnold', 'bob', 'diane']);
    });
  });

  describe('isContactAllowed', () => {
    it("allows an advisor to contact their own clients and the staff, never another advisor's client", async () => {
      const uc = makeUseCase();
      await expect(uc.isContactAllowed('alice', [RoleName.ADVISOR], 'bob')).resolves.toBe(true);
      await expect(uc.isContactAllowed('alice', [RoleName.ADVISOR], 'arnold')).resolves.toBe(true);
      await expect(uc.isContactAllowed('alice', [RoleName.ADVISOR], 'diane')).resolves.toBe(true);
      await expect(uc.isContactAllowed('alice', [RoleName.ADVISOR], 'charlie')).resolves.toBe(
        false,
      );
    });

    it('never allows contacting oneself', async () => {
      const uc = makeUseCase();
      await expect(uc.isContactAllowed('alice', [RoleName.ADVISOR], 'alice')).resolves.toBe(false);
    });
  });
});
