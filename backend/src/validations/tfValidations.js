import { z } from 'zod';

export const createTransferSchema = z.object({
  fromWarehouseId: z.string().uuid('Invalid warehouse ID'),
  toWarehouseId: z.string().uuid('Invalid warehouse ID'),
  senderId: z.string().uuid('Invalid sender ID'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    notes: z.string().optional()
  })).min(1, 'At least one item is required')
}).refine(data => data.fromWarehouseId !== data.toWarehouseId, {
  message: 'Source and destination warehouses must be different',
  path: ['toWarehouseId']
});

export const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED']),
  receiverId: z.string().uuid('Invalid receiver ID').optional()
});

export const transferFilterSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED']).optional(),
  fromWarehouseId: z.string().uuid().optional(),
  toWarehouseId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});
