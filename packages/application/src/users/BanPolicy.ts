import { RoleName } from '@forreal/domain';

export interface BanActor {
  id: string;
  roles: RoleName[];
}

export interface BanTarget {
  id: string;
  roles: RoleName[];
}

export type BanDenialReason =
  | 'SELF_BAN_FORBIDDEN'
  | 'TARGET_ROLE_NOT_BANNABLE'
  | 'ACTOR_NOT_ALLOWED';

/**
 * Matrice de bannissement / débannissement (mêmes niveaux dans les deux sens) :
 *  - DIRECTOR : peut agir sur CLIENT et ADVISOR ; jamais sur ADMIN ni DIRECTOR ;
 *  - ADMIN    : peut agir sur CLIENT, ADVISOR et DIRECTOR ; jamais sur un
 *               autre ADMIN ;
 *  - personne ne peut se bannir (ni se débannir) lui-même.
 * Appliquée CÔTÉ BACKEND — le frontend ne fait que masquer les boutons.
 */
export function checkBanPermission(actor: BanActor, target: BanTarget): BanDenialReason | null {
  if (actor.id === target.id) return 'SELF_BAN_FORBIDDEN';

  const targetIsAdmin = target.roles.includes(RoleName.ADMIN);
  const targetIsDirector = target.roles.includes(RoleName.DIRECTOR);

  if (actor.roles.includes(RoleName.ADMIN)) {
    // Un admin ne peut pas bannir (ni débannir) un autre admin.
    return targetIsAdmin ? 'TARGET_ROLE_NOT_BANNABLE' : null;
  }
  if (actor.roles.includes(RoleName.DIRECTOR)) {
    // Un director ne touche ni aux admins ni aux autres directors.
    return targetIsAdmin || targetIsDirector ? 'TARGET_ROLE_NOT_BANNABLE' : null;
  }
  return 'ACTOR_NOT_ALLOWED';
}
