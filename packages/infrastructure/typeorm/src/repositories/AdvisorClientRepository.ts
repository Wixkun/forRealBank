import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IAdvisorClientRepository } from '@forreal/domain';
import { AdvisorClient } from '@forreal/domain';
import { AdvisorClientEntity } from '../entities/AdvisorClientEntity';
import { AdvisorClientHistoryEntity } from '../entities/AdvisorClientHistoryEntity';
import { UserEntity } from '../entities/UserEntity';
import { AdvisorClientMapper } from '../mappers/AdvisorClientMapper';
import { v4 as uuidv4 } from 'uuid';

// Classe simple (pas de décorateurs Nest), instanciée via factory dans chaque
// module consommateur — même convention que AccountRepository/CardRepository.
// Un DataSource injecté par décorateur (@InjectDataSource) casserait la
// résolution DI : ce paquet infra et apps/api-nest résolvent chacun leur
// propre instance de `typeorm` dans ce monorepo pnpm, et le token par défaut
// de DataSource est la référence de CLASSE elle-même (voir
// getDataSourceToken() dans @nestjs/typeorm) — deux instances physiques du
// module `typeorm` ne partagent pas cette référence.
export class AdvisorClientRepository implements IAdvisorClientRepository {
  constructor(
    private readonly repo: Repository<AdvisorClientEntity>,
    private readonly userRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<AdvisorClient | null> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['advisor', 'client'] });
    return entity ? AdvisorClientMapper.toDomain(entity) : null;
  }

  async save(link: AdvisorClient): Promise<void> {
    const entity = AdvisorClientMapper.toPersistence(link);
    await this.repo.save(entity);
  }

  async link(advisorId: string, clientId: string): Promise<AdvisorClient> {
    if (advisorId === clientId) throw new BadRequestException('advisor and client must differ');
    const advisor = await this.userRepo.findOne({ where: { id: advisorId } });
    const client = await this.userRepo.findOne({ where: { id: clientId } });
    if (!advisor || !client) throw new NotFoundException('advisor or client not found');

    const entity = this.repo.create({ id: uuidv4(), advisor, client });
    try {
      const saved = await this.repo.save(entity);
      return AdvisorClientMapper.toDomain(saved);
    } catch (e) {
      throw new BadRequestException('link already exists');
    }
  }

  async unlink(advisorId: string, clientId: string): Promise<void> {
    await this.repo.delete({ advisor: { id: advisorId } as any, client: { id: clientId } as any });
  }

  async listClientsOf(advisorId: string): Promise<AdvisorClient[]> {
    const entities = await this.repo.find({
      where: { advisor: { id: advisorId } as any },
      relations: ['advisor', 'client'],
    });
    return entities.map(AdvisorClientMapper.toDomain);
  }

  async findAdvisorOf(clientId: string): Promise<AdvisorClient | null> {
    const entity = await this.repo.findOne({
      where: { client: { id: clientId } as any },
      relations: ['advisor', 'client'],
    });
    return entity ? AdvisorClientMapper.toDomain(entity) : null;
  }

  async countByAdvisorIds(advisorIds: string[]): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const id of advisorIds) counts[id] = 0;
    if (advisorIds.length === 0) return counts;

    const rows = await this.repo
      .createQueryBuilder('link')
      .select('link.advisor_id', 'advisorId')
      .addSelect('COUNT(*)', 'count')
      .where('link.advisor_id IN (:...advisorIds)', { advisorIds })
      .groupBy('link.advisor_id')
      .getRawMany<{ advisorId: string; count: string }>();

    for (const row of rows) counts[row.advisorId] = Number(row.count);
    return counts;
  }

  async replaceAdvisor(params: {
    clientId: string;
    newAdvisorId: string;
    changedBy: string;
  }): Promise<{ oldAdvisorId: string | null }> {
    return this.dataSource.transaction(async (manager) => {
      // Verrouille le lien courant du client : deux réattributions
      // concurrentes se sérialisent au lieu de laisser un état incohérent.
      const rows: Array<{ id: string; advisor_id: string }> = await manager.query(
        `SELECT id, advisor_id FROM advisor_clients WHERE client_id = $1 FOR UPDATE`,
        [params.clientId],
      );
      const oldAdvisorId = rows[0]?.advisor_id ?? null;
      if (oldAdvisorId === params.newAdvisorId) {
        throw new Error('ADVISOR_UNCHANGED');
      }

      await manager.query(`DELETE FROM advisor_clients WHERE client_id = $1`, [params.clientId]);
      await manager.query(
        `INSERT INTO advisor_clients (id, advisor_id, client_id) VALUES ($1, $2, $3)`,
        [uuidv4(), params.newAdvisorId, params.clientId],
      );
      await manager.getRepository(AdvisorClientHistoryEntity).insert({
        clientId: params.clientId,
        oldAdvisorId,
        newAdvisorId: params.newAdvisorId,
        changedBy: params.changedBy,
      });

      return { oldAdvisorId };
    });
  }
}
