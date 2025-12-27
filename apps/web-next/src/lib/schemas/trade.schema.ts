import { z } from 'zod';

export const tradeSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol too long')
    .regex(/^[A-Z0-9]+$/, 'Symbol must contain only uppercase letters and numbers')
    .transform((val) => val.toUpperCase()),
  quantity: z
    .string()
    .min(1, 'Quantity is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Quantity must be greater than 0',
    })
    .transform((val) => Number(val)),
  orderType: z.enum(['market', 'limit', 'stop'], {
    message: 'Invalid order type',
  }),
  price: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === '') return true;
        return !isNaN(Number(val)) && Number(val) > 0;
      },
      { message: 'Price must be greater than 0' }
    )
    .transform((val) => (val && val !== '' ? Number(val) : undefined)),
}).refine(
  (data) => {
    if (data.orderType !== 'market' && !data.price) {
      return false;
    }
    return true;
  },
  {
    message: 'Price is required for limit and stop orders',
    path: ['price'],
  }
);

export type TradeFormData = z.infer<typeof tradeSchema>;
