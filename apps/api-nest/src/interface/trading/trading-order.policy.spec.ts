import { BadRequestException } from '@nestjs/common';
import { validateMarketExecution } from './trading-order.policy';

describe('validateMarketExecution', () => {
  it('calcule le montant monétaire arrondi d’un achat autorisé', () => {
    expect(
      validateMarketExecution({
        side: 'buy',
        quantity: 1.25,
        executionPrice: 198.42,
        cashBalance: 1_000,
        heldQuantity: 0,
      }),
    ).toBe(248.03);
  });

  it('refuse un achat supérieur au solde espèces', () => {
    expect(() =>
      validateMarketExecution({
        side: 'buy',
        quantity: 1,
        executionPrice: 200,
        cashBalance: 199.99,
        heldQuantity: 0,
      }),
    ).toThrow(BadRequestException);
  });

  it('refuse une vente à découvert', () => {
    expect(() =>
      validateMarketExecution({
        side: 'sell',
        quantity: 2,
        executionPrice: 100,
        cashBalance: 0,
        heldQuantity: 1.5,
      }),
    ).toThrow('Quantité disponible insuffisante');
  });
});
