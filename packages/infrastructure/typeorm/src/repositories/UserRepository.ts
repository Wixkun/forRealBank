import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';

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
    const userEntity = await this.userRepository.findOne({ where: { id }, relations: ['roles'] });
    return userEntity ? UserMapper.toDomain(userEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { email }, relations: ['roles'] });
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
    const existingNames = new Set(existingRoles.map(r => r.name));
    const missing = uniqueRoleNames.filter(n => !existingNames.has(n));
    if (missing.length) {
      const toSave = missing.map(n => Object.assign(new RoleEntity(), { name: n }));
      await this.roleRepository.save(toSave);
    }
    return this.roleRepository.find({ where: { name: In(uniqueRoleNames) } });
  }

  async save(user: User): Promise<void> {
    const userRecord  = UserMapper.toPersistence(user);
    const roleNames: RoleName[] = Array.from((user as any).roles ?? new Set<RoleName>()) as RoleName[];
    const effectiveRoleNames = roleNames.length ? roleNames : [RoleName.CLIENT];
    const roles = await this.resolveRoles(effectiveRoleNames);

    const entity = this.userRepository.create({
      id: userRecord .id,
      email: userRecord .email,
      passwordHash: userRecord .passwordHash,
      firstName: userRecord .firstName,
      lastName: userRecord .lastName,
      lastLoginAt: userRecord .lastLoginAt ?? null,
      isBanned: userRecord .isBanned ?? false,
      bannedAt: userRecord .bannedAt ?? null,
      banReason: userRecord .banReason ?? null,
      roles,
    });

    await this.userRepository.save(entity);
  }

  async deleteById(id: string): Promise<void> {
    await this.userRepository.delete({ id });
  }

  async list(params: { limit?: number; offset?: number; search?: string } = {}): Promise<User[]> {
    const { limit = 20, offset = 0, search } = params;
    const where = search
      ? [
        { email: ILike(`%${search}%`) },
        { firstName: ILike(`%${search}%`) },
        { lastName: ILike(`%${search}%`) },
      ]
      : {};
    const entities = await this.userRepository.find({
      where,
      relations: ['roles'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
    return entities.map(UserMapper.toDomain);
  }

  async count(params: { search?: string } = {}): Promise<number> {
    const { search } = params;
    const where = search
      ? [
        { email: ILike(`%${search}%`) },
        { firstName: ILike(`%${search}%`) },
        { lastName: ILike(`%${search}%`) },
      ]
      : {};
    return this.userRepository.count({ where });
  }
}
