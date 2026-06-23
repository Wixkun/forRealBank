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