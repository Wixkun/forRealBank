import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAdvisorClientRepository } from '@forreal/domain/chat/ports/IAdvisorClientRepository';
import { AdvisorClient } from '@forreal/domain/chat/AdvisorClient';
import { AdvisorClientEntity } from '../entities/AdvisorClientEntity';
import { UserEntity } from '../entities/UserEntity';
import { AdvisorClientMapper } from '../mappers/AdvisorClientMapper';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdvisorClientRepository implements IAdvisorClientRepository {
  constructor(
    @InjectRepository(AdvisorClientEntity)
    private readonly repo: Repository<AdvisorClientEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
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
    const entities = await this.repo.find({ where: { advisor: { id: advisorId } as any }, relations: ['advisor', 'client'] });
    return entities.map(AdvisorClientMapper.toDomain);
  }

  async findAdvisorOf(clientId: string): Promise<AdvisorClient | null> {
    const entity = await this.repo.findOne({ where: { client: { id: clientId } as any }, relations: ['advisor', 'client'] });
    return entity ? AdvisorClientMapper.toDomain(entity) : null;
  }
}
