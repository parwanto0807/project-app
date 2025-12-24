import { z } from 'zod';
import {
    PurchaseOrderStatus,
    SupplierInvoiceStatus,
    SupplierPaymentMethod,
    PaymentTermPurchaseOrder
} from '@/types/poType';

// Helper Schemas
export const decimalSchema = z.string().or(z.number()).transform(val => {
    if (typeof val === 'string') {
        const num = parseFloat(val);
        if (isNaN(num)) throw new Error('Invalid decimal number');
        return num;
    }
    return val;
});

export const dateSchema = z.string().or(z.date()).transform(val => {
    if (typeof val === 'string') {
        const date = new Date(val);
        if (isNaN(date.getTime())) throw new Error('Invalid date');
        return date;
    }
    return val;
});

// Enum Schemas
export const purchaseOrderStatusSchema = z.nativeEnum(PurchaseOrderStatus);
export const supplierInvoiceStatusSchema = z.nativeEnum(SupplierInvoiceStatus);
export const supplierPaymentMethodSchema = z.nativeEnum(SupplierPaymentMethod);
export const paymentTermPurchaseOrderSchema = z.nativeEnum(PaymentTermPurchaseOrder);

// Base Purchase Order Line Schema (without refinements for reusability)
const basePurchaseOrderLineSchema = z.object({
    id: z.string().uuid().optional(),
    productId: z.string().uuid({ message: "Product ID must be a valid UUID" }),
    description: z.string().min(1, { message: "Description is required" }).max(500),
    quantity: decimalSchema.refine(val => val > 0, {
        message: "Quantity must be greater than 0"
    }),
    unitPrice: decimalSchema.refine(val => val >= 0, {
        message: "Unit price cannot be negative"
    }),
    totalAmount: decimalSchema.refine(val => val >= 0, {
        message: "Total amount cannot be negative"
    }),
    receivedQuantity: decimalSchema.default(0).refine(val => val >= 0, {
        message: "Received quantity cannot be negative"
    }),
    prDetailId: z.string().uuid({ message: "PR Detail ID must be a valid UUID" }).nullable().optional(),
});

// Purchase Order Line Schema with refinements
export const purchaseOrderLineSchema = basePurchaseOrderLineSchema.refine(data => {
    // Validate that totalAmount equals quantity * unitPrice (with rounding tolerance)
    const calculatedTotal = data.quantity * data.unitPrice;
    return Math.abs(calculatedTotal - data.totalAmount) < 0.01;
}, {
    message: "Total amount must equal quantity multiplied by unit price",
    path: ["totalAmount"]
});

// Base Purchase Order Schema (without refinements for reusability)
const basePurchaseOrderSchema = z.object({
    id: z.string().uuid().optional(),
    poNumber: z.string().min(1, { message: "PO Number is required" }).max(50),
    orderDate: dateSchema.refine(date => date <= new Date(), {
        message: "Order date cannot be in the future"
    }),
    expectedDeliveryDate: dateSchema.optional().nullable().refine(date => !date || date >= new Date(), {
        message: "Expected delivery date cannot be in the past"
    }),
    status: purchaseOrderStatusSchema.default(PurchaseOrderStatus.DRAFT),
    warehouseId: z.string().uuid({ message: "Warehouse ID must be a valid UUID" }),
    supplierId: z.string().uuid({ message: "Supplier ID must be a valid UUID" }),
    projectId: z.string().uuid({ message: "Project ID must be a valid UUID" }).nullable().optional(),
    orderedById: z.string().uuid({ message: "Ordered By ID must be a valid UUID" }),
    paymentTerm: paymentTermPurchaseOrderSchema.default(PaymentTermPurchaseOrder.COD),
    subtotal: decimalSchema.default(0).refine(val => val >= 0, {
        message: "Subtotal cannot be negative"
    }),
    taxAmount: decimalSchema.default(0).refine(val => val >= 0, {
        message: "Tax amount cannot be negative"
    }),
    totalAmount: decimalSchema.default(0).refine(val => val >= 0, {
        message: "Total amount cannot be negative"
    }),
    sPKId: z.string().uuid({ message: "SPK ID must be a valid UUID" }).nullable().optional(),
    purchaseRequestId: z.string().uuid({ message: "Purchase Request ID must be a valid UUID" }).nullable().optional(),
    lines: z.array(purchaseOrderLineSchema).min(1, {
        message: "At least one line item is required"
    }),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});

// Purchase Order Schema with refinements
export const purchaseOrderSchema = basePurchaseOrderSchema.refine(data => {
    // Validate that totalAmount equals subtotal + taxAmount (with rounding tolerance)
    const calculatedTotal = data.subtotal + data.taxAmount;
    return Math.abs(calculatedTotal - data.totalAmount) < 0.01;
}, {
    message: "Total amount must equal subtotal plus tax amount",
    path: ["totalAmount"]
}).refine(data => {
    // Validate that subtotal equals sum of line totals (with rounding tolerance)
    const linesTotal = data.lines.reduce((sum, line) => sum + line.totalAmount, 0);
    return Math.abs(linesTotal - data.subtotal) < 0.01;
}, {
    message: "Subtotal must equal sum of line item totals",
    path: ["subtotal"]
});

// Input Schemas for API
export const createPurchaseOrderSchema = basePurchaseOrderSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
}).extend({
    orderDate: z.string().or(z.date()).transform(val => {
        if (typeof val === 'string') {
            return new Date(val);
        }
        return val;
    }),
    expectedDeliveryDate: z.string().or(z.date()).transform(val => {
        if (!val) return null;
        if (typeof val === 'string') {
            return new Date(val);
        }
        return val;
    }).nullable().optional(),
});

export const updatePurchaseOrderSchema = basePurchaseOrderSchema.partial().omit({
    id: true,
    poNumber: true,
    createdAt: true,
    updatedAt: true,
}).extend({
    expectedDeliveryDate: z.string().or(z.date()).transform(val => {
        if (!val) return null;
        if (typeof val === 'string') {
            return new Date(val);
        }
        return val;
    }).nullable().optional(),
    lines: z.array(basePurchaseOrderLineSchema.partial()).optional(),
});

export const updatePurchaseOrderStatusSchema = z.object({
    status: purchaseOrderStatusSchema,
    // Optional: Add reason for status change
    reason: z.string().max(500).optional(),
});

export const purchaseOrderQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
    status: purchaseOrderStatusSchema.optional(),
    supplierId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
    endDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
    sortBy: z.enum(['orderDate', 'poNumber', 'totalAmount', 'expectedDeliveryDate']).default('orderDate'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).refine(data => {
    if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
    }
    return true;
}, {
    message: "Start date must be before or equal to end date",
    path: ["startDate"]
});

// Response Schemas
export const purchaseOrderLineResponseSchema = basePurchaseOrderLineSchema.extend({
    id: z.string().uuid(),
    poId: z.string().uuid(),
});

export const purchaseOrderResponseSchema = basePurchaseOrderSchema.extend({
    id: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
    warehouse: z.object({
        id: z.string().uuid(),
        name: z.string(),
        // Add other warehouse fields as needed
    }).optional(),
    supplier: z.object({
        id: z.string().uuid(),
        name: z.string(),
        // Add other supplier fields as needed
    }).optional(),
    orderedBy: z.object({
        id: z.string().uuid(),
        name: z.string(),
        // Add other karyawan fields as needed
    }).optional(),
    project: z.object({
        id: z.string().uuid(),
        name: z.string(),
        // Add other project fields as needed
    }).optional().nullable(),
    lines: z.array(purchaseOrderLineResponseSchema),
});

export const purchaseOrdersResponseSchema = z.object({
    data: z.array(purchaseOrderResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
});

// Export all schemas
export const purchaseSchemas = {
    purchaseOrder: purchaseOrderSchema,
    purchaseOrderLine: purchaseOrderLineSchema,
    createPurchaseOrder: createPurchaseOrderSchema,
    updatePurchaseOrder: updatePurchaseOrderSchema,
    updatePurchaseOrderStatus: updatePurchaseOrderStatusSchema,
    purchaseOrderQuery: purchaseOrderQuerySchema,
    purchaseOrderResponse: purchaseOrderResponseSchema,
    purchaseOrdersResponse: purchaseOrdersResponseSchema,
};

// Type inference from schemas
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type UpdatePurchaseOrderStatusInput = z.infer<typeof updatePurchaseOrderStatusSchema>;
export type PurchaseOrderQueryParams = z.infer<typeof purchaseOrderQuerySchema>;
export type PurchaseOrderResponse = z.infer<typeof purchaseOrderResponseSchema>;
export type PurchaseOrdersResponse = z.infer<typeof purchaseOrdersResponseSchema>;
export type PurchaseOrderLineInput = z.infer<typeof purchaseOrderLineSchema>;
export type PurchaseOrderLineResponse = z.infer<typeof purchaseOrderLineResponseSchema>;