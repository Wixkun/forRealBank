import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsEntity } from '@forreal/infrastructure-typeorm';

const SEED_NEWS = [
  {
    title: 'Maintenance planifiée',
    content:
      'Une maintenance technique est prévue cette nuit de 2h à 4h. Certains services seront temporairement indisponibles.',
    status: 'SYSTEM',
    source: 'MANUAL',
  },
  {
    title: 'Nouvelle réglementation bancaire',
    content:
      "À compter du 1er juillet, de nouvelles règles s'appliquent aux virements internationaux. Consultez notre guide pour en savoir plus.",
    status: 'INFORMATION',
    source: 'MANUAL',
  },
] as const;

@Injectable()
export class NewsSeed implements OnModuleInit {
  constructor(
    @InjectRepository(NewsEntity)
    private readonly repo: Repository<NewsEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count > 0) return;

    const entities = SEED_NEWS.map((n) =>
      this.repo.create({
        author: null,
        userId: null,
        title: n.title,
        content: n.content,
        status: n.status,
        source: n.source,
        isActive: true,
      }),
    );

    await this.repo.save(entities);
  }
}
