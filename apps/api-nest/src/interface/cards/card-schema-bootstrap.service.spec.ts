import type { DataSource } from 'typeorm';
import { CardSchemaBootstrapService } from './card-schema-bootstrap.service';

describe('CardSchemaBootstrapService', () => {
  it('serializes and applies the compatibility patch at startup', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const dataSource = {
      transaction: jest.fn(async (work: (manager: { query: typeof query }) => Promise<void>) =>
        work({ query }),
      ),
    } as unknown as DataSource;

    await new CardSchemaBootstrapService(dataSource).onApplicationBootstrap();

    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('pg_advisory_xact_lock'));
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining('ADD COLUMN IF NOT EXISTS'));
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining('NOT EXISTS'));
  });
});
