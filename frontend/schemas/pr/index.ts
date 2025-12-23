import { z } from "zod";

export enum SourceProductType {
  PEMBELIAN_BARANG = "PEMBELIAN_BARANG", // Barang baru yang dibeli dari vendor
  PENGAMBILAN_STOK = "PENGAMBILAN_STOK", // Barang yang diambil dari gudang
  OPERATIONAL = "OPERATIONAL", // Operasional
  JASA_PEMBELIAN = "JASA_PEMBELIAN", // Jasa eksternal (dari vendor)
  JASA_INTERNAL = "JASA_INTERNAL", // Jasa internal (tanpa biaya tambahan)
}

// Enum untuk sumber produk
export const SourceProductEnum = z.enum(
  [
    "PEMBELIAN_BARANG",
    "PENGAMBILAN_STOK",
    "OPERATIONAL",
    "JASA_PEMBELIAN",
    "JASA_INTERNAL",
  ],
  {
    required_error: "Source product is required",
  }
);

// ======================= DETAIL =======================
export const PurchaseRequestDetailSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  projectBudgetId: z.string().optional(),
  jumlah: z.number().min(0.01, "Quantity must be at least 0.01"),
  satuan: z.string().min(1, "Unit is required"),
  estimasiHargaSatuan: z.number().min(0, "Unit cost cannot be negative"),
  estimasiTotalHarga: z.number().min(0, "Total cost cannot be negative"),
  catatanItem: z.string().optional(),
  sourceProduct: SourceProductEnum.optional().nullable(), // ✅ Tambahan baru
});

// ======================= CREATE =======================
export const CreatePurchaseRequestSchema = z.object({
  projectId: z.string().optional().nullable(),
  spkId: z.string().optional().nullable(),
  karyawanId: z.string().min(1, "Karyawan is required"),
  tanggalPr: z.date().optional(), // Optional karena default di model Prisma
  keterangan: z.string().max(1000, "Keterangan too long").optional(),
  details: z
    .array(PurchaseRequestDetailSchema)
    .min(1, "At least one item is required"),
});

// ======================= UPDATE =======================
export const UpdatePurchaseRequestSchema = z.object({
  spkId: z.string().optional().nullable(),
  keterangan: z.string().max(1000, "Keterangan too long").optional(),
  status: z
    .enum([
      "DRAFT",
      "REVISION_NEEDED",
      "SUBMITTED",
      "APPROVED",
      "REJECTED",
      "COMPLETED",
    ])
    .optional(),
  details: z
    .array(PurchaseRequestDetailSchema)
    .min(1, "At least one item is required")
    .optional(),
});

// ======================= UPDATE STATUS =======================
export const UpdatePurchaseRequestStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "REVISION_NEEDED",
    "SUBMITTED",
    "APPROVED",
    "REJECTED",
    "COMPLETED",
  ]),
  reviewedBy: z.string().min(1, "Reviewed by is required").optional(),
  approvedBy: z.string().min(1, "Approved by is required").optional(),
  remarks: z.string().max(500, "Remarks too long").optional(),
  warehouseAllocations: z.record(z.array(z.any())).optional(),
});

// ======================= TYPES =======================
export type PurchaseRequestDetailInput = z.infer<
  typeof PurchaseRequestDetailSchema
>;

export type CreatePurchaseRequestInput = z.infer<
  typeof CreatePurchaseRequestSchema
>;

export type UpdatePurchaseRequestInput = z.infer<
  typeof UpdatePurchaseRequestSchema
>;

export type UpdatePurchaseRequestStatusInput = z.infer<
  typeof UpdatePurchaseRequestStatusSchema
>;
