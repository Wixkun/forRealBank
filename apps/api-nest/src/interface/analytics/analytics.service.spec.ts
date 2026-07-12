import type { DataSource } from 'typeorm';
import { RoleName } from '@forreal/domain';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  it('aggregates only the authenticated client accounts and transactions', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ bank_balance: '17770.50', investment_value: '98450.25' }])
      .mockResolvedValueOnce([
        {
          id: 'credit-1',
          type: 'credit',
          description: 'Salaire',
          amount: '3500',
          created_at: new Date(),
        },
        {
          id: 'debit-1',
          type: 'debit',
          description: 'Carrefour',
          amount: '-85.40',
          created_at: new Date(),
        },
      ]);
    const service = new AnalyticsService({ query } as unknown as DataSource);

    const result = await service.overview('client-1', [RoleName.CLIENT], 6);

    expect(result.kind).toBe('client');
    if (result.kind !== 'client') throw new Error('Expected client analytics');
    expect(result.summary).toEqual(
      expect.objectContaining({ income: 3500, outgoing: 85.4, bankBalance: 17770.5 }),
    );
    expect(result.categories).toContainEqual({ name: 'food', amount: 85.4 });
    expect(query.mock.calls[0][1]).toEqual(['client-1']);
    expect(query.mock.calls[1][1]).toEqual(['client-1', 6]);
  });

  it('limits an advisor overview to assigned clients', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: 'client-1',
          first_name: 'Bob',
          last_name: 'Client',
          email: 'client1@forreal.bank',
          is_banned: false,
          last_login_at: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'client-1',
          bank_balance: '17770.50',
          investment_value: '98450.25',
          last_transaction_at: new Date(),
        },
      ])
      .mockResolvedValueOnce([]);
    const service = new AnalyticsService({ query } as unknown as DataSource);

    const result = await service.overview('advisor-1', [RoleName.ADVISOR], 6);

    expect(result.kind).toBe('staff');
    if (result.kind !== 'staff') throw new Error('Expected staff analytics');
    expect(result.scope).toBe('advisor');
    expect(result.summary.clientCount).toBe(1);
    expect(result.clients[0]).toEqual(expect.objectContaining({ name: 'Bob Client' }));
    expect(query.mock.calls[0][1]).toEqual(['advisor-1']);
  });
});
