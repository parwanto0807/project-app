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

// Enum untuk sourceProduct (sesuai Prisma)
const sourceProductEnum = z.enum([
  "PEMBELIAN_BARANG",
  "PENGAMBILAN_STOK",
  "OPERATIONAL",
  "JASA_PEMBELIAN",
  "JASA_INTERNAL",
]);

// Schema untuk projectId yang bisa string atau null (tidak harus UUID)
const projectIdSchema = z.string().optional().nullable();

export const createPurchaseRequestSchema = z
  .object({
    projectId: z.string().optional().nullable(),
    karyawanId: z.string().min(1, "Karyawan ID is required"),
    requestedById: z.string().optional().nullable(), // ✅ Add requester field
    spkId: z.string().optional().nullable(), // Sementara string dulu
    keterangan: z.string().max(500).optional().nullable(),
    details: z
      .array(
        z.object({
          productId: z.string().uuid(),
          projectBudgetId: z.string().optional(),
          jumlah: decimalSchema,
          satuan: z.string().max(20),
          estimasiHargaSatuan: decimalSchema,
          catatanItem: z.string().max(200).optional().nullable(),
          sourceProduct: sourceProductEnum.optional().nullable(),
        })
      )
      .min(1, "At least one detail item is required"),
  })
  .transform((data) => ({
    ...data,
    // PERBAIKAN: Handle semua kasus
    projectId:
      data.projectId === "" || data.projectId === undefined
        ? null
        : data.projectId,
    spkId: data.spkId === "" || data.spkId === undefined ? null : data.spkId,
  }))
  // PERBAIKAN: Fix the refine logic
  // .refine(
  //   (data) => {
  //     console.log("🔍 Refine check - Current values:", {
  //       projectId: data.projectId,
  //       spkId: data.spkId,
  //     });

  //     // PERBAIKAN: Gunakan truthy check yang benar
  //     const hasProject = data.projectId != null && data.projectId !== "";
  //     const hasSPK = data.spkId != null && data.spkId !== "";

  //     console.log(
  //       "🔍 Refine check - hasProject:",
  //       hasProject,
  //       "hasSPK:",
  //       hasSPK
  //     );

  //     // Return boolean, bukan null
  //     return hasProject || hasSPK;
  //   },
  //   {
  //     message: "Either Project or SPK is required",
  //     path: ["projectId"],
  //   }
  // );

export const updatePurchaseRequestSchema = z
  .object({
    // ✅ PERUBAHAN: Tambahkan projectId di update schema
    projectId: projectIdSchema,
    spkId: uuidSchema.optional().nullable(),
    requestedById: z.string().optional().nullable(), // ✅ Add requester field for update
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
          sourceProduct: sourceProductEnum.optional().nullable(),
        })
      )
      .min(1, "At least one detail item is required")
      .optional(),
  })
  // ✅ Transform untuk update juga
  .transform((data) => ({
    ...data,
    projectId: data.projectId?.trim() === "" ? null : data.projectId,
    spkId: data.spkId?.trim() === "" ? null : data.spkId,
  }))
  // ✅ Validasi untuk update
  // .refine(
  //   (data) => {
  //     console.log("🔍 Refine check - Current values:", {
  //       projectId: data.projectId,
  //       spkId: data.spkId,
  //     });

  //     // PERBAIKAN: Check jika null atau empty string
  //     const hasProject = data.projectId != null && data.projectId !== "";
  //     const hasSPK = data.spkId != null && data.spkId !== "";
  //     const result = hasProject || hasSPK;

  //     console.log("🔍 Refine result:", { hasProject, hasSPK, result });

  //     return result;
  //   },
  //   {
  //     message: "Either Project or SPK is required",
  //     path: ["projectId"],
  //   }
  // );

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
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(300).default(10),
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
  // ✅ PERUBAHAN: Support "null" string untuk filter
  projectId: z.string().optional().or(z.literal("null")),
  spkId: z.string().optional().or(z.literal("null")),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
});
