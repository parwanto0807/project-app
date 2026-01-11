import { z } from 'zod';

export const warehouseSchema = z.object({
  code: z.string().min(3),
  name: z.string().min(3),
  address: z.string().optional(),
  isMain: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isWip: z.boolean().optional(),
  inventoryAccountId: z.string().optional().nullable()
});
