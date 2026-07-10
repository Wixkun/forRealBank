import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Garantit l'existence de la table d'idempotence des virements sur les
 * déploiements existants qui ne rejouent pas db/init. Idempotent : plusieurs
 * replicas peuvent démarrer simultanément sans conflit.
 */
@Injectable()
export class TransfersSchemaBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(TransfersSchemaBootstrapService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS transfer_idempotency_keys (
          key text PRIMARY KEY,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
    } catch (err) {
      this.logger.warn(
        `transfer_idempotency_keys bootstrap: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
