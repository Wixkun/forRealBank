import { BadRequestException } from '@nestjs/common';

export function validateMarketExecution(input: {
  side: 'buy' | 'sell';
  quantity: number;
  executionPrice: number;
  cashBalance: number;
  heldQuantity: number;
}) {
  const executionAmount = Math.round((input.executionPrice * input.quantity + 1e-9) * 100) / 100;

  if (input.side === 'buy' && input.cashBalance < executionAmount) {
    throw new BadRequestException('Solde espèces insuffisant');
  }
  if (input.side === 'sell' && input.heldQuantity < input.quantity) {
    throw new BadRequestException('Quantité disponible insuffisante');
  }

  return executionAmount;
}
