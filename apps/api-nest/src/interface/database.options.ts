import { resolveEnvSecret } from '@forreal/infrastructure-jwt-nest';

export interface DatabaseOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export function resolveDatabaseOptions(): DatabaseOptions {
  const databaseUrlRaw = process.env.DATABASE_URL?.trim();
  let parsedDatabaseUrl: URL | undefined;
  if (databaseUrlRaw) {
    try {
      parsedDatabaseUrl = new URL(databaseUrlRaw);
    } catch {
      throw new Error('[AppModule] Invalid DATABASE_URL value');
    }
  }

  const host = process.env.DB_HOST?.trim() || parsedDatabaseUrl?.hostname || 'db';

  const portRaw = process.env.DB_PORT?.trim() || parsedDatabaseUrl?.port || '5432';
  const port = parseInt(portRaw, 10);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`[AppModule] Invalid DB_PORT value: ${JSON.stringify(portRaw)}`);
  }

  const username =
    process.env.DB_USER?.trim() ||
    (parsedDatabaseUrl?.username ? decodeURIComponent(parsedDatabaseUrl.username) : '') ||
    'forreal';

  const passwordFromUrl = parsedDatabaseUrl?.password
    ? decodeURIComponent(parsedDatabaseUrl.password)
    : undefined;
  const password = resolveEnvSecret('DB_PASS') ?? passwordFromUrl ?? 'forreal';

  const databaseFromUrl = parsedDatabaseUrl?.pathname
    ? decodeURIComponent(parsedDatabaseUrl.pathname.replace(/^\/+/, ''))
    : '';
  const database = process.env.DB_NAME?.trim() || databaseFromUrl || 'forrealbank';

  return {
    host,
    port,
    username,
    password,
    database,
  };
}
