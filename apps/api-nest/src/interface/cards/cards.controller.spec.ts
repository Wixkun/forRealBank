import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CardsController } from './cards.controller';
import type { AccountEntity, CardEntity } from '@forreal/infrastructure-typeorm';
import type { Request } from 'express';
import type { Repository } from 'typeorm';

const account = {
  id: 'account-1',
  userId: 'user-1',
  name: 'Compte Courant',
  iban: 'FR761234567890',
} as AccountEntity;

const card = {
  id: 'card-1',
  accountId: account.id,
  type: 'virtual',
  lastFour: '4789',
  expiryDate: new Date('2029-07-01T00:00:00.000Z'),
  status: 'active',
  onlinePaymentsEnabled: true,
  contactlessEnabled: true,
  internationalPaymentsEnabled: false,
  spendingLimit: 2500,
  withdrawalLimit: 500,
} as CardEntity;

const request = { user: { id: 'user-1' } } as unknown as Request;

function makeController(overrides?: {
  ownedAccount?: AccountEntity | null;
  currentCard?: CardEntity | null;
}) {
  const currentCard = overrides?.currentCard === undefined ? { ...card } : overrides.currentCard;
  const ownedAccount = overrides?.ownedAccount === undefined ? account : overrides.ownedAccount;
  const saveMock = jest.fn(async (value: CardEntity) => value);
  const cardRepo = {
    findOne: jest.fn().mockResolvedValue(currentCard),
    save: saveMock,
  } as unknown as Repository<CardEntity>;
  const accountRepo = {
    findOne: jest.fn().mockResolvedValue(ownedAccount),
  } as unknown as Repository<AccountEntity>;
  return { controller: new CardsController(cardRepo, accountRepo), cardRepo, saveMock };
}

describe('CardsController', () => {
  it('freezes a card owned by the authenticated user', async () => {
    const { controller, saveMock } = makeController();

    const result = await controller.updateStatus(card.id, { status: 'frozen' }, request);

    expect(result.status).toBe('frozen');
    expect(saveMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'frozen' }));
  });

  it('does not reveal whether a card owned by another user exists', async () => {
    const { controller } = makeController({ ownedAccount: null });

    await expect(controller.updateStatus(card.id, { status: 'frozen' }, request)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('never reactivates a card after opposition', async () => {
    const { controller } = makeController({
      currentCard: { ...card, status: 'cancelled' } as CardEntity,
    });

    await expect(controller.updateStatus(card.id, { status: 'active' }, request)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects settings changes after opposition', async () => {
    const { controller } = makeController({
      currentCard: { ...card, status: 'cancelled' } as CardEntity,
    });

    await expect(
      controller.updateSettings(card.id, { contactlessEnabled: false }, request),
    ).rejects.toThrow(BadRequestException);
  });
});
