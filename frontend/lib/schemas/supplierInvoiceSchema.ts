import { z } from "zod";

/**
 * Supplier Invoice Schema
 */
export const supplierInvoiceSchema = z.object({
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    invoiceDate: z.date({
        required_error: "Invoice date is required",
    }),
    dueDate: z.date({
        required_error: "Due date is required",
    }),
    supplierId: z.string().min(1, "Supplier is required"),
    purchaseOrderId: z.string().optional().nullable(),
    subtotal: z.number().min(0, "Subtotal must be positive"),
    taxAmount: z.number().min(0, "Tax amount must be positive").default(0),
    totalAmount: z.number().min(0, "Total amount must be positive"),
    items: z.array(
        z.object({
            productId: z.string().min(1, "Product is required"),
            productName: z.string().min(1, "Product name is required"),
            poLineId: z.string().optional().nullable(),
            goodsReceivedItemId: z.string().optional().nullable(),
            quantity: z.number().min(0.0001, "Quantity must be greater than 0"),
            unitPrice: z.number().min(0, "Unit price must be positive"),
            totalPrice: z.number().min(0, "Total price must be positive"),
            priceVariance: z.number().default(0),
        })
    ).min(1, "At least one item is required"),
}).refine(
    (data) => data.dueDate >= data.invoiceDate,
    {
        message: "Due date must be after invoice date",
        path: ["dueDate"],
    }
);

/**
 * Update Supplier Invoice Schema
 */
export const updateSupplierInvoiceSchema = z.object({
    invoiceNumber: z.string().min(1).optional(),
    invoiceDate: z.date().optional(),
    dueDate: z.date().optional(),
    status: z.enum(['DRAFT', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
    subtotal: z.number().min(0).optional(),
    taxAmount: z.number().min(0).optional(),
    totalAmount: z.number().min(0).optional(),
});

/**
 * Supplier Payment Schema
 */
export const supplierPaymentSchema = z.object({
    paymentNumber: z.string().min(1, "Payment number is required"),
    paymentDate: z.date({
        required_error: "Payment date is required",
    }),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'E_WALLET'], {
        required_error: "Payment method is required",
    }),
    bankAccountId: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    allocations: z.array(
        z.object({
            amount: z.number().min(0.01, "Allocation amount must be greater than 0"),
            supplierInvoiceId: z.string().min(1, "Invoice is required"),
            paymentVoucherId: z.string().min(1, "Payment voucher is required"),
        })
    ).min(1, "At least one allocation is required"),
}).refine(
    (data) => {
        const totalAllocated = data.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
        return Math.abs(totalAllocated - data.amount) < 0.01;
    },
    {
        message: "Total allocated amount must equal payment amount",
        path: ["allocations"],
    }
);

/**
 * Update Supplier Payment Schema
 */
export const updateSupplierPaymentSchema = z.object({
    paymentDate: z.date().optional(),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'E_WALLET']).optional(),
    bankAccountId: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

/**
 * Invoice Filter Schema
 */
export const invoiceFilterSchema = z.object({
    search: z.string().optional(),
    status: z.enum(['DRAFT', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
    supplierId: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
});

/**
 * Payment Filter Schema
 */
export const paymentFilterSchema = z.object({
    search: z.string().optional(),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'E_WALLET']).optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
});

/**
 * Invoice Item Schema (for dynamic forms)
 */
export const invoiceItemSchema = z.object({
    productId: z.string().min(1, "Product is required"),
    productName: z.string().min(1, "Product name is required"),
    poLineId: z.string().optional().nullable(),
    goodsReceivedItemId: z.string().optional().nullable(),
    quantity: z.number().min(0.0001, "Quantity must be greater than 0"),
    unitPrice: z.number().min(0, "Unit price must be positive"),
    totalPrice: z.number().min(0, "Total price must be positive"),
    priceVariance: z.number().default(0),
});

/**
 * Payment Allocation Schema (for dynamic forms)
 */
export const paymentAllocationSchema = z.object({
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    supplierInvoiceId: z.string().min(1, "Invoice is required"),
    invoiceNumber: z.string().optional(),
    paymentVoucherId: z.string().min(1, "Payment voucher is required"),
});

// Export types
export type SupplierInvoiceFormData = z.infer<typeof supplierInvoiceSchema>;
export type UpdateSupplierInvoiceFormData = z.infer<typeof updateSupplierInvoiceSchema>;
export type SupplierPaymentFormData = z.infer<typeof supplierPaymentSchema>;
export type UpdateSupplierPaymentFormData = z.infer<typeof updateSupplierPaymentSchema>;
export type InvoiceFilterFormData = z.infer<typeof invoiceFilterSchema>;
export type PaymentFilterFormData = z.infer<typeof paymentFilterSchema>;
export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;
export type PaymentAllocationFormData = z.infer<typeof paymentAllocationSchema>;
