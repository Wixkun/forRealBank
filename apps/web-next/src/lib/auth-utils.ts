export const AUTH_CONFIG = {
  TOKEN_EXPIRY_MINUTES: 15,
  COOKIE_MAX_AGE_MS: 15 * 60 * 1000,
  MAX_AUTH_RETRY_ATTEMPTS: 3,
  AUTH_RETRY_DELAY_MS: 500,
  COOKIE_SAME_SITE_SECURE: 'none',
  COOKIE_SAME_SITE_DEV: 'lax',
} as const;

export function extractLocaleFromPathname(pathname: string): string {
  const locale = pathname.split('/')[1];
  return locale || 'en';
}

export async function performAuthCheck(
  apiUrl: string,
  maxRetries: number = AUTH_CONFIG.MAX_AUTH_RETRY_ATTEMPTS,
): Promise<boolean> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${apiUrl}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return true;
      }

      if (response.status === 401) {
        return false;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isLastAttempt = attempt === maxRetries - 1;

      if (!isLastAttempt) {
        await new Promise((resolve) => setTimeout(resolve, AUTH_CONFIG.AUTH_RETRY_DELAY_MS));
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  return false;
}
