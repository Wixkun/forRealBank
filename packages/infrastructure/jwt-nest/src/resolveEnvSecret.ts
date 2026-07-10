import { readFileSync } from 'fs';

type ResolveEnvSecretOptions = {
  required?: boolean;
};

export function resolveEnvSecret(
  envName: string,
  options: ResolveEnvSecretOptions = {},
): string | undefined {
  const fileEnvName = `${envName}_FILE`;
  const filePath = process.env[fileEnvName];

  if (filePath) {
    try {
      return readFileSync(filePath, 'utf8').trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `[resolveEnvSecret] Failed to read ${fileEnvName} at "${filePath}": ${message}`,
      );
    }
  }

  const envValue = process.env[envName];
  if (envValue !== undefined) {
    return envValue.trim();
  }

  if (options.required) {
    throw new Error(`[resolveEnvSecret] Missing ${envName} (or ${fileEnvName}) in environment`);
  }

  return undefined;
}

/** Secret fixe réservé aux tests automatisés (NODE_ENV === 'test'). */
export const TEST_JWT_SECRET = 'forrealbank-test-jwt-secret';

/**
 * Résout le secret de signature/vérification des JWT.
 *
 * Le secret (JWT_SECRET ou JWT_SECRET_FILE) est OBLIGATOIRE dans tout
 * environnement autre que `test` : development, staging, production et tout
 * NODE_ENV non défini. Aucun fallback n'est toléré hors test, afin qu'un
 * déploiement lancé par erreur avec NODE_ENV=development ne puisse pas
 * utiliser un secret connu et donc forgeable.
 *
 * En environnement `test` uniquement, un secret fixe dédié est utilisé si
 * aucune variable n'est fournie, pour permettre aux tests de démarrer.
 *
 * Une valeur vide ou composée uniquement d'espaces est traitée comme absente.
 * Le secret n'est jamais inclus dans un message d'erreur ni journalisé.
 */
export function resolveJwtSecret(): string {
  const secret = resolveEnvSecret('JWT_SECRET');
  if (secret) return secret; // resolveEnvSecret applique déjà .trim()

  if (process.env.NODE_ENV === 'test') {
    return TEST_JWT_SECRET;
  }

  throw new Error('JWT_SECRET is required. The application cannot start without a JWT secret.');
}
