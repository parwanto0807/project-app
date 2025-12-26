import { z } from 'zod';
import { QCStatus, ItemStatus, DocumentStatus } from '@/types/grInventoryType';

// Helper functions
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const grNumberRegex = /^GRN-\d{6}-\d{4}$/;

// Base Schemas
export const baseEntitySchema = z.object({
    id: z.string().uuid(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
});

// Enums as Zod schemas
export const qcStatusSchema = z.nativeEnum(QCStatus);
export const itemStatusSchema = z.nativeEnum(ItemStatus);
export const documentStatusSchema = z.nativeEnum(DocumentStatus);

// UUID validation helper
const uuidSchema = z.string().regex(uuidRegex, 'Invalid UUID format');

// Goods Receipt Item Schemas
export const goodsReceiptItemSchema = baseEntitySchema.extend({
    goodsReceiptId: uuidSchema,
    productId: uuidSchema,
    status: itemStatusSchema,

    qtyReceived: z.number()
        .positive('Quantity received must be positive')
        .finite(),

    unit: z.string()
        .min(1, 'Unit is required')
        .max(20, 'Unit must be less than 20 characters'),

    qtyPassed: z.number()
        .min(0, 'Quantity passed cannot be negative')
        .finite(),

    qtyRejected: z.number()
        .min(0, 'Quantity rejected cannot be negative')
        .finite()
        .default(0),

    qcStatus: qcStatusSchema,
    qcNotes: z.string()
        .max(500, 'QC notes must be less than 500 characters')
        .optional()
        .nullable(),

    stockDetailId: uuidSchema.optional().nullable(),
    purchaseRequestDetailId: uuidSchema.optional().nullable(),
    purchaseOrderLineId: uuidSchema.optional().nullable()
}).refine(
    (data) => {
        const total = data.qtyPassed + data.qtyRejected;
        const received = data.qtyReceived;
        return Math.abs(total - received) < 0.0001; // Tolerance for decimal comparison
    },
    {
        message: 'qtyPassed + qtyRejected must equal qtyReceived',
        path: ['qtyConsistency']
    }
);

// Create Goods Receipt Item DTO Schema
export const createGoodsReceiptItemSchema = z.object({
    productId: uuidSchema,

    qtyReceived: z.number()
        .positive('Quantity must be greater than 0')
        .finite(),

    unit: z.string()
        .min(1, 'Unit is required')
        .max(20, 'Unit must be less than 20 characters'),

    qtyPassed: z.number()
        .min(0, 'Quantity passed cannot be negative')
        .finite()
        .optional(),

    qtyRejected: z.number()
        .min(0, 'Quantity rejected cannot be negative')
        .finite()
        .default(0)
        .optional(),

    qcStatus: qcStatusSchema.default(QCStatus.PENDING),
    qcNotes: z.string()
        .max(500, 'QC notes must be less than 500 characters')
        .optional()
        .nullable(),

    purchaseOrderLineId: uuidSchema.optional().nullable(),
    purchaseRequestDetailId: uuidSchema.optional().nullable()
}).refine(
    (data) => {
        const passed = data.qtyPassed ?? data.qtyReceived;
        const rejected = data.qtyRejected ?? 0;
        const total = passed + rejected;
        return Math.abs(total - data.qtyReceived) < 0.0001;
    },
    {
        message: 'qtyPassed + qtyRejected must equal qtyReceived',
        path: ['qtyConsistency']
    }
);

// Update QC Item Schema
export const updateQCItemSchema = z.object({
    itemId: uuidSchema,

    qcStatus: qcStatusSchema.optional(),

    qtyPassed: z.number()
        .min(0, 'Quantity passed cannot be negative')
        .finite()
        .optional(),

    qtyRejected: z.number()
        .min(0, 'Quantity rejected cannot be negative')
        .finite()
        .optional(),

    qcNotes: z.string()
        .max(500, 'QC notes must be less than 500 characters')
        .optional()
        .nullable()
}).refine(
    (data) => {
        // For PARTIAL status, both quantities are required
        if (data.qcStatus === QCStatus.PARTIAL) {
            return data.qtyPassed !== undefined && data.qtyRejected !== undefined;
        }
        return true;
    },
    {
        message: 'Both qtyPassed and qtyRejected are required for PARTIAL status',
        path: ['qtyRequired']
    }
).refine(
    (data) => {
        // Either provide qcStatus or both quantities
        const hasQuantities = data.qtyPassed !== undefined && data.qtyRejected !== undefined;
        const hasStatus = data.qcStatus !== undefined;
        return hasQuantities || hasStatus;
    },
    {
        message: 'Either provide qcStatus or both qtyPassed and qtyRejected',
        path: ['validation']
    }
).refine(
    (data) => {
        // If quantities are provided, they must be consistent
        if (data.qtyPassed !== undefined && data.qtyRejected !== undefined) {
            // Note: We don't have qtyReceived here, so we can't validate consistency
            // This should be validated in the backend with the original qtyReceived
            return data.qtyPassed >= 0 && data.qtyRejected >= 0;
        }
        return true;
    }
);

// Goods Receipt Schemas
export const goodsReceiptSchema = baseEntitySchema.extend({
    grNumber: z.string()
        .min(1, 'GR Number is required')
        .max(50, 'GR Number must be less than 50 characters')
        .regex(grNumberRegex, 'Format must be GRN-YYYYMM-0001'),

    receivedDate: z.date()
        .max(new Date(), 'Received date cannot be in the future'),

    vendorDeliveryNote: z.string()
        .min(1, 'Vendor delivery note is required')
        .max(100, 'Vendor delivery note must be less than 100 characters'),

    vehicleNumber: z.string()
        .max(20, 'Vehicle number must be less than 20 characters')
        .optional()
        .nullable(),

    driverName: z.string()
        .max(100, 'Driver name must be less than 100 characters')
        .optional()
        .nullable(),

    purchaseOrderId: uuidSchema.optional().nullable(),
    warehouseId: uuidSchema.optional().nullable(),

    receivedById: uuidSchema,

    status: documentStatusSchema,
    notes: z.string()
        .max(1000, 'Notes must be less than 1000 characters')
        .optional()
        .nullable(),

    items: z.array(goodsReceiptItemSchema).min(1, 'At least one item is required')
});

// Create Goods Receipt DTO Schema
export const createGoodsReceiptSchema = z.object({
    grNumber: z.string()
        .max(50, 'GR Number must be less than 50 characters')
        .regex(grNumberRegex, 'Format must be GRN-YYYYMM-0001')
        .optional(),

    receivedDate: z.date()
        .max(new Date(), 'Received date cannot be in the future')
        .default(() => new Date())
        .optional(),

    vendorDeliveryNote: z.string()
        .min(1, 'Vendor delivery note is required')
        .max(100, 'Vendor delivery note must be less than 100 characters'),

    vehicleNumber: z.string()
        .max(20, 'Vehicle number must be less than 20 characters')
        .optional()
        .nullable(),

    driverName: z.string()
        .max(100, 'Driver name must be less than 100 characters')
        .optional()
        .nullable(),

    purchaseOrderId: uuidSchema,
    warehouseId: uuidSchema,

    receivedById: uuidSchema,

    notes: z.string()
        .max(1000, 'Notes must be less than 1000 characters')
        .optional()
        .nullable(),

    items: z.array(createGoodsReceiptItemSchema)
        .min(1, 'At least one item is required')
}).refine(
    (data) => {
        // Validate that all items have consistent quantities
        return data.items.every(item => {
            const passed = item.qtyPassed ?? item.qtyReceived;
            const rejected = item.qtyRejected ?? 0;
            const total = passed + rejected;
            return Math.abs(total - item.qtyReceived) < 0.0001;
        });
    },
    {
        message: 'All items must have consistent quantities (qtyPassed + qtyRejected = qtyReceived)',
        path: ['items']
    }
);

// Update Goods Receipt DTO Schema
export const updateGoodsReceiptSchema = z.object({
    grNumber: z.string()
        .max(50, 'GR Number must be less than 50 characters')
        .regex(grNumberRegex, 'Format must be GRN-YYYYMM-0001')
        .optional(),

    receivedDate: z.date()
        .max(new Date(), 'Received date cannot be in the future')
        .optional(),

    vendorDeliveryNote: z.string()
        .max(100, 'Vendor delivery note must be less than 100 characters')
        .optional(),

    vehicleNumber: z.string()
        .max(20, 'Vehicle number must be less than 20 characters')
        .optional()
        .nullable(),

    driverName: z.string()
        .max(100, 'Driver name must be less than 100 characters')
        .optional()
        .nullable(),

    purchaseOrderId: uuidSchema.optional().nullable(),
    warehouseId: uuidSchema.optional().nullable(),

    notes: z.string()
        .max(1000, 'Notes must be less than 1000 characters')
        .optional()
        .nullable(),

    status: documentStatusSchema.optional()
});

// Update QC DTO Schema
export const updateQCSchema = z.object({
    items: z.array(updateQCItemSchema)
        .min(1, 'At least one item is required')
});

// Filter Schemas
export const goodsReceiptFilterSchema = z.object({
    page: z.number()
        .int()
        .positive()
        .default(1)
        .optional(),

    limit: z.number()
        .int()
        .min(1)
        .max(100)
        .default(10)
        .optional(),

    sortBy: z.string()
        .default('receivedDate')
        .optional(),

    sortOrder: z.enum(['asc', 'desc'])
        .default('desc')
        .optional(),

    search: z.string()
        .optional()
        .nullable(),

    startDate: z.date()
        .optional()
        .nullable(),

    endDate: z.date()
        .optional()
        .nullable(),

    status: documentStatusSchema
        .optional()
        .nullable(),

    warehouseId: uuidSchema
        .optional()
        .nullable(),

    purchaseOrderId: uuidSchema
        .optional()
        .nullable(),

    qcStatus: qcStatusSchema
        .optional()
        .nullable(),

    vendorId: uuidSchema
        .optional()
        .nullable()
});

export const pendingQCFilterSchema = z.object({
    page: z.number()
        .int()
        .positive()
        .default(1)
        .optional(),

    limit: z.number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .optional()
});

// Validation functions for business logic
export const validateQCStatusTransition = (
    currentStatus: QCStatus,
    newStatus: QCStatus
): { valid: boolean; message?: string } => {
    const allowedTransitions: Record<QCStatus, QCStatus[]> = {
        [QCStatus.PENDING]: [QCStatus.PENDING, QCStatus.PASSED, QCStatus.REJECTED, QCStatus.PARTIAL],
        [QCStatus.PARTIAL]: [QCStatus.PARTIAL, QCStatus.PASSED, QCStatus.REJECTED],
        [QCStatus.PASSED]: [QCStatus.PASSED], // Once passed, can't change
        [QCStatus.REJECTED]: [QCStatus.REJECTED] // Once rejected, can't change
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
        return {
            valid: false,
            message: `Cannot change QC status from ${currentStatus} to ${newStatus}`
        };
    }

    return { valid: true };
};

export const validateDocumentStatusTransition = (
    currentStatus: DocumentStatus,
    newStatus: DocumentStatus,
    hasPendingQC: boolean
): { valid: boolean; message?: string } => {
    const allowedTransitions: Record<DocumentStatus, DocumentStatus[]> = {
        [DocumentStatus.DRAFT]: [DocumentStatus.DRAFT, DocumentStatus.COMPLETED, DocumentStatus.CANCELLED],
        [DocumentStatus.COMPLETED]: [DocumentStatus.COMPLETED, DocumentStatus.CANCELLED],
        [DocumentStatus.CANCELLED]: [DocumentStatus.CANCELLED]
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
        return {
            valid: false,
            message: `Cannot change document status from ${currentStatus} to ${newStatus}`
        };
    }

    // Cannot mark as COMPLETED if there are pending QC items
    if (newStatus === DocumentStatus.COMPLETED && hasPendingQC) {
        return {
            valid: false,
            message: 'Cannot complete goods receipt with pending QC items'
        };
    }

    return { valid: true };
};

// Helper schemas for form validation
export const goodsReceiptFormSchema = createGoodsReceiptSchema;

export const qcFormSchema = z.object({
    items: z.array(
        z.object({
            itemId: uuidSchema,
            productName: z.string(),
            qtyReceived: z.number(),
            qtyPassed: z.number()
                .min(0, 'Quantity passed cannot be negative')
                .finite(),
            qtyRejected: z.number()
                .min(0, 'Quantity rejected cannot be negative')
                .finite(),
            qcStatus: qcStatusSchema,
            qcNotes: z.string()
                .max(500, 'QC notes must be less than 500 characters')
                .optional()
                .nullable()
        })
    ).min(1).refine(
        (items) => items.every(item => {
            const total = item.qtyPassed + item.qtyRejected;
            return Math.abs(total - item.qtyReceived) < 0.0001;
        }),
        {
            message: 'For each item, qtyPassed + qtyRejected must equal qtyReceived'
        }
    )
});

// Default values for forms
export const defaultGoodsReceiptFormValues: z.infer<typeof goodsReceiptFormSchema> = {
    grNumber: undefined, // Optional: will be auto-generated by backend
    receivedDate: new Date(),
    vendorDeliveryNote: '',
    vehicleNumber: '',
    driverName: '',
    purchaseOrderId: '',
    warehouseId: '',
    receivedById: '',
    notes: '',
    items: []
};

export const defaultQCFormValues: z.infer<typeof qcFormSchema> = {
    items: []
};

// Type exports for convenience
export type GoodsReceiptFormData = z.infer<typeof goodsReceiptFormSchema>;
export type CreateGoodsReceiptDTO = z.infer<typeof createGoodsReceiptSchema>;
export type UpdateGoodsReceiptDTO = z.infer<typeof updateGoodsReceiptSchema>;
export type UpdateQCDTO = z.infer<typeof updateQCSchema>;
export type GoodsReceiptFilter = z.infer<typeof goodsReceiptFilterSchema>;
export type GoodsReceiptItemFormData = z.infer<typeof createGoodsReceiptItemSchema>;
export type QCItemFormData = z.infer<typeof updateQCItemSchema>;
export type QCFormData = z.infer<typeof qcFormSchema>;

// Core entity types
export type GoodsReceipt = z.infer<typeof goodsReceiptSchema>;
export type GoodsReceiptItem = z.infer<typeof goodsReceiptItemSchema>;

// API Response types
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type GoodsReceiptListResponse = z.infer<typeof goodsReceiptListResponseSchema>;
export type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    details?: string;
};

// Re-export enum types from grInventoryType for convenience
export type { QCStatus, DocumentStatus } from '@/types/grInventoryType';

// Extended types with partial support
export type PartialGoodsReceiptFormData = Partial<GoodsReceiptFormData>;
export type PartialUpdateQCDTO = Partial<UpdateQCDTO>;

// API Request/Response Schemas
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema.optional(),
        message: z.string().optional(),
        error: z.string().optional(),
        details: z.string().optional()
    });

export const paginationMetaSchema = z.object({
    totalCount: z.number(),
    totalPages: z.number(),
    currentPage: z.number(),
    pageSize: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
});

export const listResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        data: z.array(itemSchema),
        pagination: paginationMetaSchema,
        summary: z.any().optional()
    });

export const goodsReceiptListResponseSchema = listResponseSchema(goodsReceiptSchema);

// Validation helper functions
export const validateGRNumber = (grNumber: string): boolean => {
    return grNumberRegex.test(grNumber);
};

export const validateUUID = (id: string): boolean => {
    return uuidRegex.test(id);
};

// Transform functions for form data
export const transformToCreateDTO = (formData: GoodsReceiptFormData): CreateGoodsReceiptDTO => {
    return {
        ...formData,
        items: formData.items.map(item => ({
            ...item,
            qtyPassed: item.qtyPassed ?? item.qtyReceived,
            qtyRejected: item.qtyRejected ?? 0,
            qcStatus: item.qcStatus ?? QCStatus.PENDING
        }))
    };
};

export const transformToUpdateQCDTO = (formData: QCFormData): UpdateQCDTO => {
    return {
        items: formData.items.map(item => ({
            itemId: item.itemId,
            qcStatus: item.qcStatus,
            qtyPassed: item.qtyPassed,
            qtyRejected: item.qtyRejected,
            qcNotes: item.qcNotes
        }))
    };
};