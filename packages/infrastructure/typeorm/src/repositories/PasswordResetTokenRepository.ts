import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { IPasswordResetTokenRepository, PasswordResetToken } from '@forreal/domain';
import { PasswordResetTokenEntity } from '../entities/PasswordResetTokenEntity';

@Injectable()
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(
    @InjectRepository(PasswordResetTokenEntity)
    private readonly repository: Repository<PasswordResetTokenEntity>,
  ) {}

  async save(token: PasswordResetToken): Promise<void> {
    await this.repository.save(
      this.repository.create({
        id: token.id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        usedAt: token.usedAt ?? null,
        createdAt: token.createdAt,
      }),
    );
  }

  async findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const entity = await this.repository.findOne({ where: { tokenHash } });
    if (!entity) return null;

    return new PasswordResetToken(
      entity.id,
      entity.userId,
      entity.tokenHash,
      entity.expiresAt,
      entity.createdAt,
      entity.usedAt ?? undefined,
    );
  }

  async markUserTokensUsed(userId: string, usedAt = new Date()): Promise<void> {
    await this.repository.update({ userId, usedAt: IsNull() }, { usedAt });
  }
}
