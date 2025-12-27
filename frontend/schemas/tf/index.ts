import { z } from 'zod';

export const transferItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    notes: z.string().optional()
});

export const createTransferSchema = z.object({
    fromWarehouseId: z.string().min(1, 'Source warehouse is required'),
    toWarehouseId: z.string().min(1, 'Destination warehouse is required'),
    senderId: z.string().min(1, 'Sender is required'),
    notes: z.string().optional(),
    items: z.array(transferItemSchema).min(1, 'At least one item is required')
}).refine(data => data.fromWarehouseId !== data.toWarehouseId, {
    message: 'Source and destination warehouses must be different',
    path: ['toWarehouseId']
});

export const updateTransferStatusSchema = z.object({
    status: z.enum(['DRAFT', 'PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED']),
    receiverId: z.string().optional()
});

export const transferFilterSchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    status: z.enum(['DRAFT', 'PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED']).optional(),
    fromWarehouseId: z.string().optional(),
    toWarehouseId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferStatusInput = z.infer<typeof updateTransferStatusSchema>;
export type TransferFilter = z.infer<typeof transferFilterSchema>;
