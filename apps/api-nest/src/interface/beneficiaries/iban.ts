// Normalisation et validation d'IBAN (pur, sans dépendance — testé par
// iban.spec.ts). La validation se limite au format générique ISO 13616 :
// les IBAN émis par ForRealBank elle-même (FR76 + 23 chiffres aléatoires,
// cf. InitializeClientUseCase.generateIban) n'ont pas de clé mod-97 valide,
// on ne peut donc pas exiger la clé de contrôle sans rejeter les comptes
// internes de la banque.

/** Majuscules, sans espaces ni séparateurs. */
export function normalizeIban(raw: string): string {
  return (raw ?? '').replace(/[\s-]/g, '').toUpperCase();
}

const IBAN_FORMAT = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/;

/** `iban` doit déjà être normalisé (voir normalizeIban). */
export function isValidIban(iban: string): boolean {
  return IBAN_FORMAT.test(iban);
}
