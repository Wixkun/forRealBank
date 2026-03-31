const DEFAULT_API_ORIGIN = '';

/**
 * Base des appels API côté navigateur.
 *
 * Recommandation: utiliser le proxy Next (`/api/proxy/*`) pour éviter CORS et
 * avoir un comportement identique en local / docker.
 */
export const BROWSER_API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/proxy';

/**
 * Base des appels API côté serveur.
 *
 * En local hors docker: `http://localhost:3001/api`
 * En docker: `http://forrealbank-api:3001/api`
 */
export const SERVER_API_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Normalise une URL base en retirant le trailing slash.
 */
export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Construit une URL d'API.
 * - Si `base` commence par '/', on renvoie une URL relative.
 * - Sinon, on concatène sur l'origin fourni.
 */
export function buildApiUrl(base: string, endpoint: string): string {
  const cleanBase = normalizeBaseUrl(base || DEFAULT_API_ORIGIN);
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (cleanBase.startsWith('/')) {
    return `${cleanBase}${cleanEndpoint}`;
  }
  return `${cleanBase}${cleanEndpoint}`;
}

