import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { RoleEntity } from '@forreal/infrastructure-typeorm/entities/RoleEntity';

const DEFAULT_ROLES = ['CLIENT', 'ADVISOR', 'DIRECTOR', 'ADMIN'] as const;

@Injectable()
export class RolesSeed implements OnModuleInit {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const roleRepository = this.dataSource.getRepository(RoleEntity);
    const existingRoles = await roleRepository.findBy({
      name: In(DEFAULT_ROLES as unknown as string[]),
    });

    if (existingRoles.length === DEFAULT_ROLES.length) return;

    await roleRepository.upsert(
      DEFAULT_ROLES.map((roleName) => ({ name: roleName })),
      ['name'],
    );
  }
}
