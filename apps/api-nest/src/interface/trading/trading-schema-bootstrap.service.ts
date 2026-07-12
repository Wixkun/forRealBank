import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TradingSchemaBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(TradingSchemaBootstrapService.name);
  private readonly defaultDirectorSymbols = [
    'AAPL',
    'AMZN',
    'BTC',
    'ETH',
    'GOOGL',
    'MSFT',
    'QQQ',
    'SOL',
    'SPY',
    'TSLA',
  ];

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query(`
      ALTER TABLE market_assets
        ADD COLUMN IF NOT EXISTS proposed_by_director_id uuid NULL
          REFERENCES users(id) ON DELETE SET NULL
    `);
    await this.dataSource.query(`
      ALTER TABLE market_assets
        ADD COLUMN IF NOT EXISTS proposed_at timestamptz NULL
    `);
    await this.dataSource.query(`
      UPDATE market_assets
      SET is_tradable = false
      WHERE proposed_at IS NULL AND is_tradable = true
    `);

    const [{ count: proposedCount }] = await this.dataSource.query(`
      SELECT COUNT(*)::int AS count
      FROM market_assets
      WHERE proposed_at IS NOT NULL
    `);

    if (Number(proposedCount) === 0) {
      const [director] = await this.dataSource.query(`
        SELECT u.id
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE r.name = 'DIRECTOR'
        ORDER BY u.created_at ASC
        LIMIT 1
      `);

      if (director?.id) {
        await this.dataSource.query(
          `
            UPDATE market_assets
            SET
              is_tradable = true,
              proposed_by_director_id = $1,
              proposed_at = COALESCE(proposed_at, now())
            WHERE asset_type IN ('stock', 'etf', 'crypto')
              AND symbol = ANY($2)
          `,
          [director.id, this.defaultDirectorSymbols],
        );

        this.logger.log(
          `Seeded initial director market catalogue with ${this.defaultDirectorSymbols.length} supported assets`,
        );
      }
    }

    this.logger.log('Director-managed market catalogue schema is ready');
  }
}
