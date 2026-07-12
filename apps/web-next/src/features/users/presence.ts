// Formatage « Hors ligne depuis … » adapté à la durée (minutes → mois).
// Renvoie null pour un utilisateur jamais vu (aucune date fictive affichée).

export type LastSeenTranslator = (
  key: 'justNow' | 'minutes' | 'hours' | 'days' | 'months',
  values?: Record<string, number>,
) => string;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

export function formatLastSeen(
  lastSeenAt: string | null | undefined,
  t: LastSeenTranslator,
  now: Date = new Date(),
): string | null {
  if (!lastSeenAt) return null;
  const seen = new Date(lastSeenAt).getTime();
  if (Number.isNaN(seen)) return null;

  const elapsed = Math.max(0, now.getTime() - seen);
  if (elapsed < MINUTE) return t('justNow');
  if (elapsed < HOUR) return t('minutes', { count: Math.floor(elapsed / MINUTE) });
  if (elapsed < DAY) return t('hours', { count: Math.floor(elapsed / HOUR) });
  if (elapsed < MONTH) return t('days', { count: Math.floor(elapsed / DAY) });
  return t('months', { count: Math.floor(elapsed / MONTH) });
}
