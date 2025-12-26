import { z } from 'zod';

// Mark as Arrived DTO
export const markArrivedItemSchema = z.object({
    id: z.string(),
    qtyReceived: z.number().min(0, 'Quantity must be positive'),
});

export const markArrivedSchema = z.object({
    receivedDate: z.date(),
    vendorDeliveryNote: z.string().optional(),
    vehicleNumber: z.string().optional(),
    driverName: z.string().optional(),
    items: z.array(markArrivedItemSchema).min(1, 'At least one item required'),
});

export type MarkArrivedFormData = z.infer<typeof markArrivedSchema>;

// QC Check DTO
export const qcCheckItemSchema = z.object({
    id: z.string(),
    qtyPassed: z.number().min(0, 'Quantity must be positive'),
    qtyRejected: z.number().min(0, 'Quantity must be positive'),
    qcNotes: z.string().optional(),
});

export const qcCheckSchema = z.object({
    items: z.array(qcCheckItemSchema).min(1, 'At least one item required'),
}).refine(
    (data) => {
        // Validate that qtyPassed + qtyRejected = qtyReceived for each item
        // This will be checked in the component with actual qtyReceived data
        return true;
    },
    { message: 'Invalid quantities' }
);

export type QCCheckFormData = z.infer<typeof qcCheckSchema>;

// Approve DTO
export const approveGRSchema = z.object({
    notes: z.string().optional(),
});

export type ApproveGRFormData = z.infer<typeof approveGRSchema>;
