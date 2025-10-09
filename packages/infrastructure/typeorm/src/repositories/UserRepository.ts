import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { User } from '@forreal/domain/user/User';
import { RoleName } from '@forreal/domain/user/RoleName';
import { UserEntity } from '../entities/UserEntity';
import { RoleEntity } from '../entities/RoleEntity';
import { UserMapper } from '../mappers/UserMapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    return userEntity ? UserMapper.toDomain(userEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
    return userEntity ? UserMapper.toDomain(userEntity) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userRepository.count({ where: { email } });
    return count > 0;
  }

  private async resolveRoles(roleNames: RoleName[]): Promise<RoleEntity[]> {
    if (!roleNames.length) return [];

    const uniqueRoleNames = Array.from(new Set(roleNames));
    const existingRoles = await this.roleRepository.find({ where: { name: In(uniqueRoleNames) } });
    const existingNames = new Set(existingRoles.map(role => role.name));
    const missingRoles = uniqueRoleNames.filter(name => !existingNames.has(name));

    if (missingRoles.length) {
      const newRoles = missingRoles.map(name => {
        const role = new RoleEntity();
        role.name = name;
        return role;
      });
      await this.roleRepository.save(newRoles);
    }

    return await this.roleRepository.find({ where: { name: In(uniqueRoleNames) } });
  }

  async save(user: User): Promise<void> {
    const baseEntity = UserMapper.toPersistence(user);
    const userRoles: RoleName[] = Array.from((user as any).roles ?? new Set<RoleName>());
    const effectiveRoles = userRoles.length ? userRoles : [RoleName.CLIENT];
    const roleEntities = await this.resolveRoles(effectiveRoles);

    const userEntity = this.userRepository.create({
      id: baseEntity.id,
      email: baseEntity.email,
      passwordHash: baseEntity.passwordHash,
      firstName: baseEntity.firstName,
      lastName: baseEntity.lastName,
      lastLoginAt: baseEntity.lastLoginAt ?? null,
      isBanned: baseEntity.isBanned ?? false,
      bannedAt: baseEntity.bannedAt ?? null,
      banReason: baseEntity.banReason ?? null,
      roles: roleEntities,
    });

    await this.userRepository.save(userEntity);
  }
}
