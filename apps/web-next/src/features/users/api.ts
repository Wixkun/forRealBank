import { apiFetch } from '@/lib/api-client';
import type {
  BanRequestCard,
  ClientAccounts,
  DirectoryUser,
  ManagedTransaction,
  UserDetails,
} from './types';

// Toutes les règles de périmètre (advisor → ses clients uniquement…) sont
// appliquées côté serveur : ces fonctions ne font que transporter.

export function fetchDirectory(
  role: 'ADVISOR' | 'CLIENT',
  search?: string,
): Promise<DirectoryUser[]> {
  const params = new URLSearchParams({ role });
  const term = (search ?? '').trim();
  if (term) params.set('search', term);
  return apiFetch<DirectoryUser[]>(`/management/directory?${params.toString()}`);
}

export function fetchUserDetails(userId: string): Promise<UserDetails> {
  return apiFetch<UserDetails>(`/management/users/${encodeURIComponent(userId)}`);
}

export function fetchClientAccounts(clientId: string): Promise<ClientAccounts> {
  return apiFetch<ClientAccounts>(`/management/users/${encodeURIComponent(clientId)}/accounts`);
}

export function fetchManagedTransactions(
  kind: 'bank' | 'investment',
  accountId: string,
  range: { from?: string; to?: string } = {},
): Promise<ManagedTransaction[]> {
  const params = new URLSearchParams();
  if (range.from) params.set('from', range.from);
  if (range.to) params.set('to', range.to);
  const qs = params.toString();
  return apiFetch<ManagedTransaction[]>(
    `/management/accounts/${kind}/${encodeURIComponent(accountId)}/transactions${qs ? `?${qs}` : ''}`,
  );
}

export function reassignClient(clientId: string, advisorId: string) {
  return apiFetch<{ success: boolean }>(
    `/management/clients/${encodeURIComponent(clientId)}/reassign`,
    { method: 'POST', body: JSON.stringify({ advisorId }) },
  );
}

export function banUser(userId: string) {
  return apiFetch<{ success: boolean }>(`/users/${encodeURIComponent(userId)}/ban`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
}

export function unbanUser(userId: string) {
  return apiFetch<{ success: boolean }>(`/users/${encodeURIComponent(userId)}/unban`, {
    method: 'PATCH',
  });
}

export interface BanRequestAttachmentInput {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export function createBanRequest(input: {
  clientId: string;
  reason: string;
  attachments: BanRequestAttachmentInput[];
}) {
  return apiFetch<{ id: string; conversationId: string }>(`/management/ban-requests`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchBanRequestsByConversation(conversationId: string): Promise<BanRequestCard[]> {
  return apiFetch<BanRequestCard[]>(
    `/management/ban-requests/by-conversation/${encodeURIComponent(conversationId)}`,
  );
}

export function acceptBanRequest(requestId: string) {
  return apiFetch<{ success: boolean }>(
    `/management/ban-requests/${encodeURIComponent(requestId)}/accept`,
    { method: 'POST' },
  );
}

export function rejectBanRequest(requestId: string, comment?: string) {
  return apiFetch<{ success: boolean }>(
    `/management/ban-requests/${encodeURIComponent(requestId)}/reject`,
    { method: 'POST', body: JSON.stringify({ comment: comment || undefined }) },
  );
}
