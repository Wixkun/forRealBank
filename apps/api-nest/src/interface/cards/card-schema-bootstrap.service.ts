import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

const CARD_SCHEMA_SQL = `
  ALTER TABLE cards
    ADD COLUMN IF NOT EXISTS online_payments_enabled boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS contactless_enabled boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS international_payments_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS spending_limit decimal(10, 2) NOT NULL DEFAULT 2500.00,
    ADD COLUMN IF NOT EXISTS withdrawal_limit decimal(10, 2) NOT NULL DEFAULT 500.00;

  INSERT INTO cards (account_id, type, last_four, expiry_date)
  SELECT
    account.id,
    'virtual',
    COALESCE(
      NULLIF(right(regexp_replace(account.account_number, '[^0-9]', '', 'g'), 4), ''),
      lpad((floor(random() * 10000))::int::text, 4, '0')
    ),
    now() + interval '3 years'
  FROM accounts account
  WHERE account.account_type = 'checking'
    AND NOT EXISTS (SELECT 1 FROM cards card WHERE card.account_id = account.id);
`;

@Injectable()
export class CardSchemaBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CardSchemaBootstrapService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Two API replicas may start together in Swarm. The transaction-scoped
      // advisory lock keeps the missing-card backfill free of duplicates.
      await manager.query("SELECT pg_advisory_xact_lock(hashtext('forrealbank_card_schema'))");
      await manager.query(CARD_SCHEMA_SQL);
    });
    this.logger.log('Card schema and checking-account cards are ready');
  }
}
