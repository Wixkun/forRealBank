import { checkBanPermission } from '@forreal/application';
import { RoleName } from '@forreal/domain';

const director = { id: 'director-1', roles: [RoleName.DIRECTOR] };
const admin = { id: 'admin-1', roles: [RoleName.ADMIN] };
const client = { id: 'client-1', roles: [RoleName.CLIENT] };
const advisor = { id: 'advisor-1', roles: [RoleName.ADVISOR] };
const otherDirector = { id: 'director-2', roles: [RoleName.DIRECTOR] };
const otherAdmin = { id: 'admin-2', roles: [RoleName.ADMIN] };

describe('checkBanPermission — matrice de bannissement/débannissement', () => {
  it('director can ban a client and an advisor', () => {
    expect(checkBanPermission(director, client)).toBeNull();
    expect(checkBanPermission(director, advisor)).toBeNull();
  });

  it('director can NOT ban an admin nor another director', () => {
    expect(checkBanPermission(director, otherAdmin)).toBe('TARGET_ROLE_NOT_BANNABLE');
    expect(checkBanPermission(director, otherDirector)).toBe('TARGET_ROLE_NOT_BANNABLE');
  });

  it('admin can ban a client, an advisor and a director', () => {
    expect(checkBanPermission(admin, client)).toBeNull();
    expect(checkBanPermission(admin, advisor)).toBeNull();
    expect(checkBanPermission(admin, otherDirector)).toBeNull();
  });

  it('admin can NOT ban another admin', () => {
    expect(checkBanPermission(admin, otherAdmin)).toBe('TARGET_ROLE_NOT_BANNABLE');
  });

  it('nobody can ban themselves', () => {
    expect(checkBanPermission(director, director)).toBe('SELF_BAN_FORBIDDEN');
    expect(checkBanPermission(admin, admin)).toBe('SELF_BAN_FORBIDDEN');
  });

  it('other roles cannot ban at all (an advisor never bans directly)', () => {
    expect(checkBanPermission({ id: 'advisor-1', roles: [RoleName.ADVISOR] }, client)).toBe(
      'ACTOR_NOT_ALLOWED',
    );
    expect(checkBanPermission({ id: 'client-2', roles: [RoleName.CLIENT] }, client)).toBe(
      'ACTOR_NOT_ALLOWED',
    );
  });
});
