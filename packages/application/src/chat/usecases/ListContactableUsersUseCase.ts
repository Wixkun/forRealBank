import { IAdvisorClientRepository, IUserRepository, RoleName, User } from '@forreal/domain';

export interface ContactableUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Borne haute explicite : le list() du repository limite à 20 par défaut,
// ce qui tronquerait silencieusement l'annuaire d'un directeur.
const MAX_DIRECTORY_USERS = 500;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

// Rôle affiché : DIRECTOR prioritaire (même logique que la liste des
// conversations), sinon le premier rôle.
function displayRole(user: User): string {
  const roles = Array.from(user.roles ?? []);
  return roles.includes(RoleName.DIRECTOR) ? RoleName.DIRECTOR : (roles[0] ?? '');
}

export class ListContactableUsersUseCase {
  constructor(
    private readonly advisorClientRepository: IAdvisorClientRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: {
    requesterId: string;
    requesterRoles: RoleName[];
    search?: string;
  }): Promise<ContactableUser[]> {
    const candidates = await this.listAllowedUsers(input.requesterId, input.requesterRoles ?? []);

    const query = normalize(input.search ?? '');
    return candidates
      .filter((user) => {
        if (!query) return true;
        const first = normalize(user.firstName ?? '');
        const last = normalize(user.lastName ?? '');
        const full = `${first} ${last}`.trim();
        return first.includes(query) || last.includes(query) || full.includes(query);
      })
      .map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: displayRole(user),
      }));
  }

  /** Le demandeur a-t-il le droit d'ouvrir une conversation privée avec la cible ? */
  async isContactAllowed(
    requesterId: string,
    requesterRoles: RoleName[],
    targetUserId: string,
  ): Promise<boolean> {
    if (!targetUserId || targetUserId === requesterId) return false;
    const allowed = await this.listAllowedUsers(requesterId, requesterRoles ?? []);
    return allowed.some((user) => user.id === targetUserId);
  }

  private async listAllowedUsers(requesterId: string, roles: RoleName[]): Promise<User[]> {
    const byId = new Map<string, User>();

    if (roles.includes(RoleName.DIRECTOR)) {
      const all = await this.userRepository.list({ limit: MAX_DIRECTORY_USERS });
      for (const user of all) {
        const userRoles = user.roles ?? new Set<RoleName>();
        if (userRoles.has(RoleName.CLIENT) || userRoles.has(RoleName.ADVISOR)) {
          byId.set(user.id, user);
        }
      }
    }

    if (roles.includes(RoleName.ADVISOR)) {
      // SES clients (relation en base, jamais déduite)…
      const links = await this.advisorClientRepository.listClientsOf(requesterId);
      const clients = await this.userRepository.findByIds(links.map((l) => l.clientId));
      for (const client of clients) byId.set(client.id, client);

      // …plus l'ensemble du personnel : directors et autres advisors sont
      // toujours joignables (jamais les clients des autres advisors).
      const all = await this.userRepository.list({ limit: MAX_DIRECTORY_USERS });
      for (const user of all) {
        const userRoles = user.roles ?? new Set<RoleName>();
        if (userRoles.has(RoleName.ADVISOR) || userRoles.has(RoleName.DIRECTOR)) {
          byId.set(user.id, user);
        }
      }
    }

    if (roles.includes(RoleName.CLIENT)) {
      const link = await this.advisorClientRepository.findAdvisorOf(requesterId);
      if (link) {
        const advisor = await this.userRepository.findById(link.advisorId);
        if (advisor) byId.set(advisor.id, advisor);
      }
    }

    byId.delete(requesterId);
    return Array.from(byId.values()).filter((user) => !user.isBanned);
  }
}
