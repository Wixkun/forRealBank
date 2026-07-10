import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { EmailVerificationToken, IEmailVerificationTokenRepository } from '@forreal/domain';
import { EmailVerificationTokenEntity } from '../entities/EmailVerificationTokenEntity';

@Injectable()
export class EmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
  constructor(
    @InjectRepository(EmailVerificationTokenEntity)
    private readonly repository: Repository<EmailVerificationTokenEntity>,
  ) {}

  async save(token: EmailVerificationToken): Promise<void> {
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

  async findByHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    const entity = await this.repository.findOne({ where: { tokenHash } });
    if (!entity) return null;

    return new EmailVerificationToken(
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
