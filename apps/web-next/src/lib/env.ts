/**
 * Base des appels API côté navigateur.
 *
 * Recommandation: utiliser le proxy Next (`/api/*`) pour éviter CORS et
 * avoir un comportement identique en local / docker.
 */
export const BROWSER_API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

/**
 * Base des appels API côté serveur.
 *
 * En local hors docker: `http://localhost:3001/api`
 * En docker: `http://api:3001/api` (utilise le service name du docker-compose)
 */
export const SERVER_API_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://api:3001/api';

/**
 * Construit une URL d'API : base sans trailing slash + endpoint avec slash
 * initial. Fonctionne pour une base relative ('/api') comme absolue.
 */
export function buildApiUrl(base: string, endpoint: string): string {
  const cleanBase = (base || '').replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}
