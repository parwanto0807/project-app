import { z } from "zod";

const decimalSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, {
    message: "Must be a valid decimal number with up to 2 decimal places",
  })
  .or(z.number());

const uuidSchema = z.string().uuid({
  message: "Must be a valid UUID",
});

export const createPurchaseRequestSchema = z.object({
  projectId: uuidSchema,
  karyawanId: z.string().min(1, "Karyawan ID is required"),
  spkId: uuidSchema,
  keterangan: z.string().max(500).optional().nullable(),
  details: z
    .array(
      z.object({
        productId: uuidSchema,
        projectBudgetId: z.string().optional(),
        jumlah: decimalSchema,
        satuan: z.string().max(20),
        estimasiHargaSatuan: decimalSchema,
        catatanItem: z.string().max(200).optional().nullable(),
      })
    )
    .min(1, "At least one detail item is required"),
});

export const updatePurchaseRequestSchema = z.object({
  keterangan: z.string().max(500).optional().nullable(),
  status: z
    .enum([
      "DRAFT",
      "REVISION_NEEDED",
      "SUBMITTED",
      "APPROVED",
      "REJECTED",
      "COMPLETED",
    ])
    .or(z.literal("ALL"))
    .optional(),
  details: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        productId: uuidSchema,
        projectBudgetId: z.string().optional(),
        jumlah: decimalSchema,
        satuan: z.string().max(20),
        estimasiHargaSatuan: decimalSchema,
        catatanItem: z.string().max(200).optional().nullable(),
      })
    )
    .min(1, "At least one detail item is required")
    .optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "REVISION_NEEDED",
    "SUBMITTED",
    "APPROVED",
    "REJECTED",
    "COMPLETED",
  ]),
  catatan: z.string().max(500).optional().nullable(),
});

export const idParamSchema = z.object({
  id: uuidSchema,
});

export const queryParamsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
  status: z
    .enum(["DRAFT", "REVISION_NEEDED", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"])
    .optional(),
  projectId: uuidSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
});
