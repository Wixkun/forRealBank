import { describe, it, expect } from 'vitest';
import { formatLastSeen, type LastSeenTranslator } from './presence';

// Traducteur factice : renvoie « clé:count » pour asserter le palier choisi.
const t: LastSeenTranslator = (key, values) => (values ? `${key}:${values.count}` : key);

const NOW = new Date('2026-07-12T12:00:00Z');
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

describe('formatLastSeen — format adapté à la durée', () => {
  it('renvoie null pour un utilisateur jamais connecté (aucune date fictive)', () => {
    expect(formatLastSeen(null, t, NOW)).toBeNull();
    expect(formatLastSeen(undefined, t, NOW)).toBeNull();
    expect(formatLastSeen('not-a-date', t, NOW)).toBeNull();
  });

  it('minutes', () => {
    expect(formatLastSeen(ago(5 * 60_000), t, NOW)).toBe('minutes:5');
  });

  it('heures', () => {
    expect(formatLastSeen(ago(3 * 3_600_000), t, NOW)).toBe('hours:3');
  });

  it('jours', () => {
    expect(formatLastSeen(ago(2 * 86_400_000), t, NOW)).toBe('days:2');
  });

  it('mois', () => {
    expect(formatLastSeen(ago(35 * 86_400_000), t, NOW)).toBe('months:1');
  });

  it('à l’instant (moins d’une minute)', () => {
    expect(formatLastSeen(ago(20_000), t, NOW)).toBe('justNow');
  });
});
