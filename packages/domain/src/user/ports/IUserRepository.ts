import { User } from '../User';

export const IUserRepository = Symbol('IUserRepository');

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;

  save(user: User): Promise<void>;

  existsByEmail(email: string): Promise<boolean>;

  findById(id: string): Promise<User | null>;

  /** Récupère plusieurs utilisateurs en une requête (évite le N+1). */
  findByIds(ids: string[]): Promise<User[]>;

  deleteById(id: string): Promise<void>;

  /**
   * Met à jour la dernière présence constatée (fermeture du dernier socket,
   * déconnexion) sans passer par le cycle load/save complet de l'agrégat.
   */
  updateLastSeen(userId: string, at: Date): Promise<void>;

  list(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<import('../User').User[]>;

  count(params?: { search?: string }): Promise<number>;
}
