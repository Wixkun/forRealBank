// Normalisation / validation / masquage d'IBAN côté client (pré-validation
// UX). Même logique que apps/api-nest/src/interface/beneficiaries/iban.ts —
// dupliquée car web-next ne dépend d'aucun package du workspace ; le backend
// reste la source de vérité.

/** Majuscules, sans espaces ni séparateurs. */
export function normalizeIban(raw: string): string {
  return (raw ?? '').replace(/[\s-]/g, '').toUpperCase();
}

const IBAN_FORMAT = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/;

/**
 * `iban` doit déjà être normalisé. Format ISO 13616 uniquement — pas de clé
 * mod-97 : les IBAN générés par ForRealBank (FR76 + chiffres aléatoires)
 * n'ont pas de clé de contrôle valide.
 */
export function isValidIban(iban: string): boolean {
  return IBAN_FORMAT.test(iban);
}

/** `FR76 •••• •••• •••• 1234` : début et fin visibles, le reste masqué. */
export function maskIban(iban: string): string {
  const clean = normalizeIban(iban);
  if (clean.length <= 8) return clean;
  const hiddenGroups = Math.max(1, Math.ceil((clean.length - 8) / 4));
  return [clean.slice(0, 4), ...Array(hiddenGroups).fill('••••'), clean.slice(-4)].join(' ');
}
