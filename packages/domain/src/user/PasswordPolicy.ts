export type PasswordStrengthCheck = {
  minLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasDigit: boolean;
  hasSymbol: boolean;
};

export const PASSWORD_POLICY = {
  minLength: 12,
} as const;

/**
 * Politique: 12+ caractères, au moins 1 minuscule, 1 majuscule, 1 chiffre, 1 symbole.
 * Note: on considère comme symbole tout caractère qui n'est ni lettre ni chiffre.
 */
export function checkPasswordStrength(password: string): PasswordStrengthCheck {
  const pwd = String(password ?? '');
  return {
    minLength: pwd.length >= PASSWORD_POLICY.minLength,
    hasLower: /[a-z]/.test(pwd),
    hasUpper: /[A-Z]/.test(pwd),
    hasDigit: /\d/.test(pwd),
    hasSymbol: /[^A-Za-z0-9]/.test(pwd),
  };
}

export function isStrongPassword(password: string): boolean {
  const c = checkPasswordStrength(password);
  return c.minLength && c.hasLower && c.hasUpper && c.hasDigit && c.hasSymbol;
}

