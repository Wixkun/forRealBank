import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthSchemaBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AuthSchemaBootstrapService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    const hasEmailVerifiedColumn = await this.hasColumn('users', 'email_verified');
    const hasEmailVerifiedAtColumn = await this.hasColumn('users', 'email_verified_at');
    const hasPasswordResetTokensTable = await this.hasTable('password_reset_tokens');
    const hasEmailVerificationTokensTable = await this.hasTable('email_verification_tokens');
    const hasTwoFactorSecretColumn = await this.hasColumn('users', 'two_factor_secret');
    const hasTwoFactorEnabledColumn = await this.hasColumn('users', 'two_factor_enabled');

    if (
      hasEmailVerifiedColumn &&
      hasEmailVerifiedAtColumn &&
      hasPasswordResetTokensTable &&
      hasEmailVerificationTokensTable &&
      hasTwoFactorSecretColumn &&
      hasTwoFactorEnabledColumn
    ) {
      return;
    }

    this.logger.warn('Applying authentication schema compatibility patch');

    await this.dataSource.transaction(async (manager) => {
      await manager.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false
      `);

      await manager.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email_verified_at timestamptz NULL
      `);

      await manager.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS two_factor_secret text NULL
      `);

      await manager.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false
      `);

      await manager.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash text NOT NULL UNIQUE,
          expires_at timestamptz NOT NULL,
          used_at timestamptz NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      await manager.query(`
        CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
        ON password_reset_tokens(user_id)
      `);

      await manager.query(`
        CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash
        ON password_reset_tokens(token_hash)
      `);

      await manager.query(`
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash text NOT NULL UNIQUE,
          expires_at timestamptz NOT NULL,
          used_at timestamptz NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      await manager.query(`
        CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id
        ON email_verification_tokens(user_id)
      `);

      await manager.query(`
        CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token_hash
        ON email_verification_tokens(token_hash)
      `);

      // Existing accounts predate this feature. Mark them verified only on the
      // rollout where the column did not exist yet, so they keep access.
      if (!hasEmailVerifiedColumn) {
        await manager.query(`
          UPDATE users
          SET email_verified = true,
              email_verified_at = COALESCE(email_verified_at, last_login_at, created_at, now())
        `);
      }
    });
  }

  private async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = $1
          AND column_name = $2
        LIMIT 1
      `,
      [tableName, columnName],
    );

    return result.length > 0;
  }

  private async hasTable(tableName: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = $1
        LIMIT 1
      `,
      [tableName],
    );

    return result.length > 0;
  }
}
