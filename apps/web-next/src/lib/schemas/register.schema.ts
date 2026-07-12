import { z } from 'zod';

export interface RegisterSchemaMessages {
  firstNameTooShort: string;
  lastNameTooShort: string;
  invalidEmail: string;
  passwordTooShort: string;
  passwordComplexity: string;
  passwordsMismatch: string;
}

// Fabrique du schema avec des messages deja traduits (i18n cote appelant) :
// aucun texte utilisateur en dur ici.
export function createRegisterSchema(m: RegisterSchemaMessages) {
  return z
    .object({
      firstName: z.string().min(2, m.firstNameTooShort),
      lastName: z.string().min(2, m.lastNameTooShort),
      email: z.string().email(m.invalidEmail),
      password: z
        .string()
        .min(12, m.passwordTooShort)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
          message: m.passwordComplexity,
        }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: m.passwordsMismatch,
      path: ['confirmPassword'],
    });
}

export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;
