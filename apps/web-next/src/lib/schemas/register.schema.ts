import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name too short'),
  lastName: z.string().min(2, 'Last name too short'),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
      message: 'Password must include uppercase, lowercase, number and symbol',
    }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
