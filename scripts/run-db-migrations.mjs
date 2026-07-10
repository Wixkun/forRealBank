#!/usr/bin/env node
// Runner de migrations SQL idempotent et ordonné.
//
// Stratégie de schéma unique de ForRealBank :
//   - db/init/00-init.sql : schéma canonique appliqué UNE FOIS sur une base
//     neuve (docker-entrypoint-initdb.d).
//   - db/migrations/*.sql  : deltas ordonnés (par nom) appliqués sur les bases
//     EXISTANTES par ce runner, qui trace ce qui a déjà été exécuté dans la
//     table schema_migrations. Chaque migration reste idempotente
//     (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
//
// Usage :
//   DATABASE_URL=postgres://user:pass@host:5432/db node scripts/run-db-migrations.mjs
//
// À appeler au déploiement, avant de (re)démarrer l'API.

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'db', 'migrations');

function resolveConnection() {
  if (process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL };
  return {
    host: process.env.DB_HOST ?? 'db',
    port: Number(process.env.DB_PORT ?? '5432'),
    user: process.env.DB_USER ?? 'forreal',
    password: process.env.DB_PASS ?? 'forreal',
    database: process.env.DB_NAME ?? 'forrealbank',
  };
}

async function main() {
  const client = new Client(resolveConnection());
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      const already = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
      if (already.rowCount && already.rowCount > 0) continue;

      const sql = await readFile(join(migrationsDir, file), 'utf8');
      console.log(`[migrations] applying ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err instanceof Error ? err.message : err}`);
      }
    }

    console.log('[migrations] up to date');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
