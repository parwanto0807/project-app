import { z } from "zod";

// === Helper schemas ===
export const uuidSchema = z.string().uuid("ID harus berupa UUID yang valid");

export const decimalSchema = z
  .number()
  .positive("Nilai harus positif")
  .refine(
    (val) => {
      const decimalPart = val.toString().split(".")[1];
      return !decimalPart || decimalPart.length <= 2;
    },
    { message: "Maksimal 2 digit desimal" }
  );

export const nonNegativeDecimalSchema = z
  .number()
  .min(0, "Nilai tidak boleh negatif")
  .refine(
    (val) => {
      const decimalPart = val.toString().split(".")[1];
      return !decimalPart || decimalPart.length <= 2;
    },
    { message: "Maksimal 2 digit desimal" }
  );
export const decimalAllowNegativeSchema = z
  .number({
    required_error: "Nilai harus diisi",
    invalid_type_error: "Nilai harus berupa angka",
  })
  .refine(
    (val) => {
      const decimalPart = val.toString().split(".")[1];
      return !decimalPart || decimalPart.length <= 2;
    },
    {
      message: "Maksimal 2 digit desimal",
    }
  );

// === Update Detail Schema ===
export const updateDetailSchema = z
  .object({
    tanggalTransaksi: z.coerce
      .date()
      .optional()
      .refine((val) => !val || val <= new Date(), {
        message: "Tanggal transaksi tidak boleh melebihi tanggal sekarang",
      }),
    keterangan: z.string().max(255).optional(),
    jumlah: decimalSchema.optional(),
    nomorBukti: z.string().max(100).optional().or(z.literal("")),
    jenisPembayaran: z
      .enum(["CASH", "TRANSFER", "DEBIT", "CREDIT_CARD", "QRIS"])
      .optional(),
    productId: uuidSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update",
  });

export const JenisPembayaranEnum = z.enum([
  "CASH",
  "TRANSFER",
  "DEBIT",
  "CREDIT_CARD",
  "QRIS",
]);

// === ID Schemas ===
export const lppIdSchema = z.object({
  id: uuidSchema,
});

// === Upload Foto ===
export const uploadFotoSchema = z.object({
  keterangan: z.string().max(255).optional().or(z.literal("")),
});

export const LppItemSchema = z.object({
  tanggalTransaksi: z.coerce.date({
    required_error: "Tanggal transaksi harus diisi",
    invalid_type_error: "Format tanggal tidak valid",
  }),
  keterangan: z.string().min(1, "Keterangan harus diisi").max(255),
  jumlah: decimalSchema,
  nomorBukti: z.string().optional(),
  jenisPembayaran: JenisPembayaranEnum.optional(),
  purchaseRequestDetailId: z.string().optional(),
  productId: z.string().min(1, "Produk harus dipilih"),
  fotoBukti: z.array(uploadFotoSchema).optional(),
});

// Schema utama LPP
export const createLppSchema = z.object({
  // purchaseRequestId: z.string().min(1),
  details: z.array(LppItemSchema).min(1),
  // totalAmount: z.number().min(0),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "REVISION"]).optional(),
  totalBiaya: z.number().optional(),
  sisaUangDikembalikan: z.number().optional(),
  uangMukaId: z.string().optional(),
  keterangan: z.string().optional(),
});

// === Update LPP ===
export const updateLppSchema = z
  .object({
    // Header fields
    totalBiaya: nonNegativeDecimalSchema.optional(),
    sisaUangDikembalikan: decimalAllowNegativeSchema.optional(),
    keterangan: z.string().max(500).optional().or(z.literal("")),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "REVISION"]).optional(),
    uangMukaId: uuidSchema.optional(),

    // Detail opsional (pakai schema item yang sama)
    details: z
      .array(
        z.object({
          id: uuidSchema.optional(), // untuk update existing detail
          tanggalTransaksi: z.coerce.date().optional(),
          keterangan: z.string().max(255).optional(),
          jumlah: nonNegativeDecimalSchema.optional(),
          nomorBukti: z.string().max(100).optional().or(z.literal("")),
          jenisPembayaran: z
            .enum(["CASH", "TRANSFER", "DEBIT", "CREDIT_CARD", "QRIS"])
            .optional(),
          productId: uuidSchema.optional(),
          purchaseRequestDetailId: uuidSchema.optional(),

          fotoBukti: z
            .array(
              z.object({
                id: uuidSchema.optional(), // foto existing
                keterangan: z.string().max(255).optional().or(z.literal("")),
              })
            )
            .optional(),
        })
      )
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update",
  });

export const detailIdSchema = z.object({
  detailId: uuidSchema,
});

export const fotoIdSchema = z.object({
  fotoId: uuidSchema,
});

// === Status Update ===
export const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "REVISION"], {
    required_error: "Status harus diisi",
    invalid_type_error: "Status tidak valid",
  }),
  catatan: z.string().max(500).optional().or(z.literal("")),
});

// === Query Params ===
export const lppQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page harus bilangan bulat")
    .positive("Page harus positif")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit harus bilangan bulat")
    .positive("Limit harus positif")
    .max(100, "Maksimal 100 data per page")
    .default(10),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "REVISION"]).optional(),
  search: z.string().max(100).optional(),
});
