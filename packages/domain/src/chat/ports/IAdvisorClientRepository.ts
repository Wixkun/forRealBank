import { AdvisorClient } from '../AdvisorClient';

export const IAdvisorClientRepository = Symbol('IAdvisorClientRepository');

export interface IAdvisorClientRepository {
  findById(id: string): Promise<AdvisorClient | null>;
  save(link: AdvisorClient): Promise<void>;
  link(advisorId: string, clientId: string): Promise<AdvisorClient>;
  unlink(advisorId: string, clientId: string): Promise<void>;
  listClientsOf(advisorId: string): Promise<AdvisorClient[]>;
  findAdvisorOf(clientId: string): Promise<AdvisorClient | null>;
}
