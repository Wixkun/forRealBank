import { DataSource } from 'typeorm';
import { AuthSchemaBootstrapService } from './auth-schema-bootstrap.service';

describe('AuthSchemaBootstrapService', () => {
  it('creates password_reset_tokens when an existing database does not have it', async () => {
    const schemaChecks = [
      [{ exists: 1 }],
      [{ exists: 1 }],
      [],
      [{ exists: 1 }],
      [{ exists: 1 }],
      [{ exists: 1 }],
    ];
    const executedSql: string[] = [];
    const dataSource = {
      query: jest.fn(async () => schemaChecks.shift() ?? []),
      transaction: jest.fn(
        async (callback: (manager: { query: (sql: string) => Promise<void> }) => Promise<void>) =>
          callback({
            query: async (sql: string) => {
              executedSql.push(sql);
            },
          }),
      ),
    } as unknown as DataSource;

    await new AuthSchemaBootstrapService(dataSource).onModuleInit();

    expect(executedSql.join('\n')).toContain('CREATE TABLE IF NOT EXISTS password_reset_tokens');
    expect(executedSql.join('\n')).toContain('idx_password_reset_tokens_token_hash');
  });
});
