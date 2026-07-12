import { AdvisorClient } from '../AdvisorClient';

export const IAdvisorClientRepository = Symbol('IAdvisorClientRepository');

export interface IAdvisorClientRepository {
  findById(id: string): Promise<AdvisorClient | null>;
  save(link: AdvisorClient): Promise<void>;
  link(advisorId: string, clientId: string): Promise<AdvisorClient>;
  unlink(advisorId: string, clientId: string): Promise<void>;
  listClientsOf(advisorId: string): Promise<AdvisorClient[]>;
  findAdvisorOf(clientId: string): Promise<AdvisorClient | null>;

  /**
   * Nombre de clients assignés à chaque advisor (une seule requête groupée).
   * Les advisors sans client sont renvoyés avec 0.
   */
  countByAdvisorIds(advisorIds: string[]): Promise<Record<string, number>>;

  /**
   * Réattribue un client à un nouvel advisor de façon ATOMIQUE (transaction) :
   * retrait de l'ancien lien, création du nouveau et ligne d'audit dans
   * advisor_client_history. Renvoie l'ancien advisor (null si première
   * attribution). Lève ADVISOR_UNCHANGED si le client est déjà rattaché à cet
   * advisor.
   */
  replaceAdvisor(params: {
    clientId: string;
    newAdvisorId: string;
    changedBy: string;
  }): Promise<{ oldAdvisorId: string | null }>;
}
