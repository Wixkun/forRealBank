import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '@forreal/domain/user/ports/IUserRepository';
import { User } from '@forreal/domain/user/User';
import { UserEntity } from '../entities/UserEntity';
import { UserMapper } from '../mappers/UserMapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@InjectRepository(UserEntity) private readonly repo: Repository<UserEntity>) {}

  async findByEmail(email: string): Promise<User | null> {
    const e = await this.repo.findOne({ where: { email } });
    return e ? UserMapper.toDomain(e) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const cnt = await this.repo.count({ where: { email } });
    return cnt > 0;
  }

  async save(user: User): Promise<void> {
    await this.repo.save(UserMapper.toEntity(user));
  }
}
