import { isValidIban, normalizeIban } from './iban';

describe('normalizeIban', () => {
  it('retire les espaces/tirets et met en majuscules', () => {
    expect(normalizeIban('fr14 2004-1010 0505 0001 3m02 606')).toBe('FR1420041010050500013M02606');
  });

  it('tolère les entrées vides', () => {
    expect(normalizeIban('')).toBe('');
    expect(normalizeIban(undefined as unknown as string)).toBe('');
  });
});

describe('isValidIban', () => {
  it.each([
    'FR1420041010050500013M02606',
    'DE89370400440532013000',
    'GB29NWBK60161331926819',
    'BE68539007547034',
  ])('accepte un IBAN réel valide (%s)', (iban) => {
    expect(isValidIban(iban)).toBe(true);
  });

  it('accepte les IBAN générés par ForRealBank (pas de clé mod-97 valide)', () => {
    // Format des comptes internes : FR76 + 23 chiffres aléatoires
    // (InitializeClientUseCase.generateIban + seeds de db/init).
    expect(isValidIban(normalizeIban('FR76 9876 5432 1098 7654 3210 987'))).toBe(true);
    expect(isValidIban(normalizeIban('FR76 1234 5678 9012 3456 7890 123'))).toBe(true);
  });

  it('rejette les formats invalides', () => {
    expect(isValidIban('')).toBe(false);
    expect(isValidIban('FR76')).toBe(false); // trop court
    expect(isValidIban('1234567890123456')).toBe(false); // pas de code pays
    expect(isValidIban('FR76!@#$%^&*()123456')).toBe(false); // caractères interdits
    // Non normalisé (espaces) : la validation attend un IBAN normalisé.
    expect(isValidIban('FR14 2004 1010 0505 0001 3M02 606')).toBe(false);
  });
});
