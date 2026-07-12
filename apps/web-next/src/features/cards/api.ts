import type { BankCard, BankCardStatus, CardSettings } from './types';

async function cardRequest(path: string, init?: RequestInit): Promise<BankCard> {
  const response = await fetch(`/api/cards/${path}`, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new Error(message || `Card request failed (${response.status})`);
  }
  return data as BankCard;
}

export async function fetchMyCards(): Promise<BankCard[]> {
  const response = await fetch('/api/cards/me', { credentials: 'include' });
  if (!response.ok) throw new Error(`Failed to load cards (${response.status})`);
  return response.json();
}

export function updateCardStatus(id: string, status: BankCardStatus): Promise<BankCard> {
  return cardRequest(`${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function updateCardSettings(id: string, settings: CardSettings): Promise<BankCard> {
  return cardRequest(`${id}/settings`, { method: 'PATCH', body: JSON.stringify(settings) });
}
