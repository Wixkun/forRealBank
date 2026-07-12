import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BeneficiaryEntity, NotificationEntity, UserEntity } from '@forreal/infrastructure-typeorm';
import { NewsStatus, NotificationTargetType } from '@forreal/domain';
import { BeneficiariesService } from './beneficiaries.service';
import { NewsService } from '../feed/news.service';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const VALID_IBAN_RAW = 'fr14 2004 1010 0505 0001 3m02 606';
const VALID_IBAN = 'FR1420041010050500013M02606';

function buildService(overrides?: {
  existing?: BeneficiaryEntity | null;
  saveError?: { code?: string };
  newsFails?: boolean;
}) {
  const savedRows: Array<Partial<BeneficiaryEntity>> = [];

  // Mocks bruts (jest.fn) gardés à part : les assertions du type
  // expect(mocks.findOne) portent sur eux — référencer les méthodes de l'objet
  // typé Repository déclencherait @typescript-eslint/unbound-method.
  const beneficiariesMocks = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(overrides?.existing ?? null),
    delete: jest.fn().mockResolvedValue({ affected: overrides?.existing ? 1 : 0 }),
    create: jest.fn((input: Partial<BeneficiaryEntity>) => ({
      ...input,
      id: 'ben-1',
      createdAt: new Date('2026-07-12T10:00:00Z'),
    })),
    save: jest.fn(async (entity: BeneficiaryEntity) => {
      if (overrides?.saveError) {
        // Simule une erreur du driver Postgres (Error portant un code SQLSTATE).
        throw Object.assign(new Error('duplicate key value'), overrides.saveError);
      }
      savedRows.push(entity);
      return entity;
    }),
  };
  const beneficiaries = beneficiariesMocks as unknown as Repository<BeneficiaryEntity>;

  // Repos TypeORM consommés par NotificationRepository (persistance réelle
  // simulée : create + save renvoient l'entité complète attendue du mapper).
  const notifCalls: Array<Record<string, unknown>> = [];
  const notificationRepo = {
    create: jest.fn((input: Record<string, unknown>) => input),
    save: jest.fn(async (entity: Record<string, unknown>) => {
      notifCalls.push(entity);
      return { ...entity, createdAt: new Date(), updatedAt: new Date() };
    }),
  } as unknown as Repository<NotificationEntity>;

  const userRepo = {
    findOne: jest.fn().mockResolvedValue({ id: USER_ID }),
  } as unknown as Repository<UserEntity>;

  const newsCalls: Array<Record<string, unknown>> = [];
  const newsService = {
    createAutomaticNews: jest.fn(async (params: Record<string, unknown>) => {
      if (overrides?.newsFails) throw new Error('NEWS_DOWN');
      newsCalls.push(params);
      return { id: 'news-1' };
    }),
  } as unknown as NewsService;

  const service = new BeneficiariesService(beneficiaries, notificationRepo, userRepo, newsService);
  return { service, beneficiaries: beneficiariesMocks, savedRows, newsCalls, notifCalls };
}

describe('BeneficiariesService.create', () => {
  it('normalise l’IBAN, persiste, puis crée une news privée et une notification', async () => {
    const { service, savedRows, newsCalls, notifCalls } = buildService();

    const result = await service.create(USER_ID, 'Jean Dupont', VALID_IBAN_RAW);

    expect(result).toMatchObject({ id: 'ben-1', label: 'Jean Dupont', iban: VALID_IBAN });
    expect(savedRows[0]).toMatchObject({ userId: USER_ID, iban: VALID_IBAN });

    // News ciblée vers l'utilisateur uniquement, catégorie ACCOUNT.
    expect(newsCalls).toHaveLength(1);
    expect(newsCalls[0]).toMatchObject({
      targetUserId: USER_ID,
      status: NewsStatus.ACCOUNT,
    });
    expect(String(newsCalls[0].content)).toContain('Jean Dupont');

    // Notification non lue ciblant la news créée.
    expect(notifCalls).toHaveLength(1);
    expect(notifCalls[0]).toMatchObject({
      targetType: NotificationTargetType.NEWS,
      targetId: 'news-1',
      isRead: false,
    });
  });

  it('rejette un IBAN invalide (400) sans rien persister ni notifier', async () => {
    const { service, savedRows, newsCalls } = buildService();

    await expect(service.create(USER_ID, 'Jean', 'FR76INVALIDE')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(savedRows).toHaveLength(0);
    expect(newsCalls).toHaveLength(0);
  });

  it('rejette un doublon (409) détecté par lecture préalable', async () => {
    const { service, newsCalls } = buildService({
      existing: { id: 'ben-0' } as BeneficiaryEntity,
    });

    await expect(service.create(USER_ID, 'Jean', VALID_IBAN)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(newsCalls).toHaveLength(0);
  });

  it('convertit la violation d’unicité SQL (course) en 409 sans notifier', async () => {
    const { service, newsCalls } = buildService({ saveError: { code: '23505' } });

    await expect(service.create(USER_ID, 'Jean', VALID_IBAN)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(newsCalls).toHaveLength(0);
  });

  it('n’échoue pas l’ajout si la news/notification échoue (robustesse)', async () => {
    const { service, savedRows } = buildService({ newsFails: true });

    const result = await service.create(USER_ID, 'Jean Dupont', VALID_IBAN);
    expect(result.iban).toBe(VALID_IBAN);
    expect(savedRows).toHaveLength(1);
  });
});

describe('BeneficiariesService.updateLabel / delete', () => {
  it('modifie le libellé d’un bénéficiaire appartenant à l’utilisateur', async () => {
    const existing = {
      id: 'ben-0',
      userId: USER_ID,
      label: 'Ancien nom',
      iban: VALID_IBAN,
      createdAt: new Date(),
    } as BeneficiaryEntity;
    const { service, beneficiaries } = buildService({ existing });

    const result = await service.updateLabel(USER_ID, 'ben-0', 'Nouveau nom');

    expect(result.label).toBe('Nouveau nom');
    // Périmètre : la lecture est filtrée par (id, userId), jamais par id seul.
    expect(beneficiaries.findOne).toHaveBeenCalledWith({
      where: { id: 'ben-0', userId: USER_ID },
    });
  });

  it('renvoie 404 si le bénéficiaire n’appartient pas à l’utilisateur', async () => {
    const { service } = buildService();
    await expect(service.updateLabel(USER_ID, 'ben-x', 'Nom')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('supprime avec le périmètre (id, userId) et renvoie 404 sinon', async () => {
    const existing = { id: 'ben-0' } as BeneficiaryEntity;
    const { service, beneficiaries } = buildService({ existing });

    await service.delete(USER_ID, 'ben-0');
    expect(beneficiaries.delete).toHaveBeenCalledWith({ id: 'ben-0', userId: USER_ID });

    const { service: serviceEmpty } = buildService();
    await expect(serviceEmpty.delete(USER_ID, 'ben-0')).rejects.toBeInstanceOf(NotFoundException);
  });
});
