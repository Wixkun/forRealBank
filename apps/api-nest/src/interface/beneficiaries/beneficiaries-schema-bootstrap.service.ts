import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Garantit la table beneficiaries sur les déploiements existants (qui ne
 * rejouent pas db/init). Même SQL que db/migrations/20260712_beneficiaries.sql.
 * Idempotent — plusieurs replicas peuvent démarrer en même temps.
 */
@Injectable()
export class BeneficiariesSchemaBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BeneficiariesSchemaBootstrapService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS beneficiaries (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          label varchar(100) NOT NULL,
          iban varchar(34) NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (user_id, iban)
        )
      `);
      await this.dataSource.query(
        `CREATE INDEX IF NOT EXISTS idx_beneficiaries_user ON beneficiaries(user_id)`,
      );
    } catch (err) {
      this.logger.warn(
        `beneficiaries schema bootstrap: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
