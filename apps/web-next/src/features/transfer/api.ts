import { apiFetch } from '@/lib/api-client';

export interface Beneficiary {
  id: string;
  label: string;
  iban: string;
  createdAt: string;
}

export function fetchBeneficiaries(): Promise<Beneficiary[]> {
  return apiFetch<Beneficiary[]>('/beneficiaries');
}

export function createBeneficiary(input: { label: string; iban: string }): Promise<Beneficiary> {
  return apiFetch<Beneficiary>('/beneficiaries', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Seul le libellé est modifiable (l'IBAN est immuable côté backend). */
export function updateBeneficiary(id: string, input: { label: string }): Promise<Beneficiary> {
  return apiFetch<Beneficiary>(`/beneficiaries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteBeneficiary(id: string): Promise<void> {
  return apiFetch<void>(`/beneficiaries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
