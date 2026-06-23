import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsEntity } from '@forreal/infrastructure-typeorm';
import { randomUUID } from 'crypto';

const SEED_NEWS = [
  {
    title: 'Connexion depuis un nouvel appareil',
    content: 'Une connexion à votre compte a été détectée depuis un appareil inconnu. Si ce n\'était pas vous, sécurisez immédiatement votre compte.',
    status: 'SECURITY',
  },
  {
    title: 'Virement reçu avec succès',
    content: 'Vous avez reçu un virement de 1 250,00 € sur votre compte principal. Le solde a été mis à jour.',
    status: 'TRANSACTIONS',
  },
  {
    title: 'Prélèvement automatique programmé',
    content: 'Un prélèvement de 89,99 € est prévu le 28 de ce mois pour votre abonnement. Vérifiez que votre solde est suffisant.',
    status: 'PAYMENTS',
  },
  {
    title: 'Informations de profil mises à jour',
    content: 'Les informations de votre compte ont été modifiées. Si vous n\'êtes pas à l\'origine de ce changement, contactez le support.',
    status: 'ACCOUNT_UPDATES',
  },
  {
    title: 'Maintenance planifiée',
    content: 'Une maintenance technique est prévue cette nuit de 2h à 4h. Certains services seront temporairement indisponibles.',
    status: 'SYSTEM',
  },
  {
    title: 'Nouvelle réglementation bancaire',
    content: 'À compter du 1er juillet, de nouvelles règles s\'appliquent aux virements internationaux. Consultez notre guide pour en savoir plus.',
    status: 'INFORMATION',
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
    if (count > 0) return; // Ne seed qu'une seule fois

    const entities = SEED_NEWS.map((n) =>
      this.repo.create({
        id: randomUUID(),
        author: null,
        userId: null,
        title: n.title,
        content: n.content,
        status: n.status,
        archivedAt: null,
      }),
    );

    await this.repo.save(entities);
  }
}
