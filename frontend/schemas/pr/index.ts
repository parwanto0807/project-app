import { z } from 'zod';

export const PurchaseRequestDetailSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  projectBudgetId: z.string().optional(),
  jumlah: z.number().min(0.01, 'Quantity must be at least 0.01'),
  satuan: z.string().min(1, 'Unit is required'),
  estimasiHargaSatuan: z.number().min(0, 'Unit cost cannot be negative'),
  estimasiTotalHarga: z.number().min(0, 'Total cost cannot be negative'),
  catatanItem: z.string().optional(),
});

export const CreatePurchaseRequestSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  spkId: z.string().min(1, 'SPK is required'),
  karyawanId: z.string().min(1, 'Karyawan is required'),
  tanggalPr: z.date().optional(), // Optional karena ada default value di model
  keterangan: z.string().max(1000, 'Keterangan too long').optional(),
  details: z.array(PurchaseRequestDetailSchema).min(1, 'At least one item is required'),
});

export const UpdatePurchaseRequestSchema = z.object({
  keterangan: z.string().max(1000, 'Keterangan too long').optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  details: z.array(PurchaseRequestDetailSchema).min(1, 'At least one item is required').optional(),
});

export const UpdatePurchaseRequestStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED']),
  reviewedBy: z.string().min(1, 'Reviewed by is required').optional(),
  approvedBy: z.string().min(1, 'Approved by is required').optional(),
  remarks: z.string().max(500, 'Remarks too long').optional(),
});

export type CreatePurchaseRequestInput = z.infer<typeof CreatePurchaseRequestSchema>;
export type UpdatePurchaseRequestInput = z.infer<typeof UpdatePurchaseRequestSchema>;
export type UpdatePurchaseRequestStatusInput = z.infer<typeof UpdatePurchaseRequestStatusSchema>;
export type PurchaseRequestDetailInput = z.infer<typeof PurchaseRequestDetailSchema>;