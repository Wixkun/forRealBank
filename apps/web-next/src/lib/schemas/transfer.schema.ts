import { z } from 'zod';

export const transferSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Amount must be greater than 0',
    }),
  recipient: z
    .string()
    .min(14, 'Invalid IBAN format')
    .max(34, 'Invalid IBAN format')
    .regex(/^[A-Z]{2}[0-9]{2}/, 'IBAN must start with country code and check digits'),
  description: z.string().max(140, 'Description must be 140 characters or less').optional(),
});

export type TransferFormData = z.infer<typeof transferSchema>;
