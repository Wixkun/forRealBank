/**
 * Sélectionne l'identifiant le moins chargé parmi des candidats :
 *  1. identifie la charge minimale ;
 *  2. conserve uniquement les candidats à ce minimum ;
 *  3. s'il n'en reste qu'un, le renvoie ; sinon tirage aléatoire entre eux.
 * Utilisé pour l'attribution d'un advisor à un nouveau client et pour
 * l'attribution d'une demande de bannissement à un director.
 */
export function pickLeastLoadedId(
  candidates: Array<{ id: string; count: number }>,
  random: () => number = Math.random,
): string | null {
  if (candidates.length === 0) return null;
  const min = Math.min(...candidates.map((c) => c.count));
  const leastLoaded = candidates.filter((c) => c.count === min);
  const chosen = leastLoaded[Math.floor(random() * leastLoaded.length)] ?? leastLoaded[0];
  return chosen.id;
}
