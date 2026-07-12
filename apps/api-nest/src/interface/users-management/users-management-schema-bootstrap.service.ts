import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Garantit le schéma de la gestion des utilisateurs sur les déploiements
 * existants (qui ne rejouent pas db/init) : colonne last_seen_at, historique
 * des réattributions et table des demandes de bannissement. Idempotent —
 * plusieurs replicas peuvent démarrer en même temps.
 */
@Injectable()
export class UsersManagementSchemaBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(UsersManagementSchemaBootstrapService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.dataSource.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NULL`,
      );
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS advisor_client_history (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          old_advisor_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
          new_advisor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          changed_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await this.dataSource.query(
        `CREATE INDEX IF NOT EXISTS idx_advisor_client_history_client
         ON advisor_client_history(client_id)`,
      );
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ban_requests (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          advisor_requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          assigned_director_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          reason text NOT NULL,
          status varchar(20) NOT NULL DEFAULT 'PENDING'
            CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
          conversation_id uuid NULL REFERENCES conversations(id) ON DELETE SET NULL,
          message_id uuid NULL REFERENCES messages(id) ON DELETE SET NULL,
          decision_comment text NULL,
          processed_at timestamptz NULL,
          processed_by_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await this.dataSource.query(
        `CREATE INDEX IF NOT EXISTS idx_ban_requests_director_status
         ON ban_requests(assigned_director_id, status)`,
      );
      await this.dataSource.query(
        `CREATE INDEX IF NOT EXISTS idx_ban_requests_conversation
         ON ban_requests(conversation_id)`,
      );
    } catch (err) {
      this.logger.warn(
        `users-management schema bootstrap: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
