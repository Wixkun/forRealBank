import { BROWSER_API_BASE, buildApiUrl } from '@/lib/env';

export type ApiKind = 'UNAUTHORIZED' | 'FORBIDDEN' | 'BANNED' | 'UNKNOWN';

export class ApiError extends Error {
  status: number;
  kind: ApiKind;

  constructor(message: string, status: number, kind: ApiKind = 'UNKNOWN') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
  }
}

const API_URL = buildApiUrl(BROWSER_API_BASE, '');

function classify(kindStatus: number, message?: string): ApiKind {
  const msg = (message || '').toLowerCase();
  if (kindStatus === 401) return 'UNAUTHORIZED';
  if (kindStatus === 403 && msg.includes('banned')) return 'BANNED';
  if (kindStatus === 403) return 'FORBIDDEN';
  return 'UNKNOWN';
}

function getField(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const rec = obj as Record<string, unknown>;
  const val = rec[key];
  return typeof val === 'string' ? val : undefined;
}

export async function apiFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message =
      getField(payload, 'message') ||
      getField(payload, 'error') ||
      (typeof payload === 'string' ? payload : undefined) ||
      `HTTP ${res.status}`;

    throw new ApiError(String(message), res.status, classify(res.status, String(message)));
  }

  return payload as T;
}
