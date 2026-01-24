// @ts-check
import { z } from "zod";
import {
  UangMukaStatus,
  MetodePembayaran,
} from "../../prisma/generated/prisma/client.js";

// Helper untuk validasi UUID
const uuidSchema = z.string().uuid();

// Helper untuk validasi URL opsional
const optionalUrlSchema = z.string().url().optional().or(z.literal(""));

// Helper untuk validasi decimal/number
const decimalSchema = z.number().positive();

// ========================
// VALIDATION SCHEMAS
// ========================

export const createUangMukaValidation = z
  .object({
    tanggalPengajuan: z.coerce.date().optional(),
    tanggalPencairan: z.coerce.date().optional().nullable(),
    jumlah: z.number().min(0.01, "Quantity must be greater than 0"),
    keterangan: z.string().max(500).optional().default(""),
    purchaseRequestId: z.string().max(500).optional().default(""),
    karyawanId: z.string().max(500).optional().default(""),
    spkId: z.string().max(500).optional().default(""),
    metodePencairan: z.nativeEnum(MetodePembayaran),
    namaBankTujuan: z.string().optional(),
    nomorRekeningTujuan: z.string().optional(),
    namaEwalletTujuan: z.string().optional(),
    buktiPencairanUrl: z.string().optional(),
    accountPencairanId: z.string().optional(),
    salesOrderId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Validasi metode pembayaran
    if (data.metodePencairan === "BANK_TRANSFER") {
      if (!data.namaBankTujuan || !data.nomorRekeningTujuan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Nama bank dan nomor rekening wajib diisi untuk transfer bank",
          path: ["namaBankTujuan"],
        });
      }
    } else if (data.metodePencairan === "E_WALLET") {
      if (!data.namaEwalletTujuan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama E-Wallet wajib diisi",
          path: ["namaEwalletTujuan"],
        });
      }
    }
  });

export const updateUangMukaValidation = z
  .object({
    tanggalPengajuan: z.coerce.date().optional(),
    tanggalPencairan: z.coerce.date().optional().nullable(),
    jumlah: decimalSchema.optional(),
    keterangan: z.string().max(500).optional().default(""),
    status: z.nativeEnum(UangMukaStatus).optional(),
    buktiPencairanUrl: optionalUrlSchema,
    purchaseRequestId: uuidSchema.optional().nullable(),
    karyawanId: uuidSchema.optional(),
    spkId: uuidSchema.optional(),
    metodePencairan: z.nativeEnum(MetodePembayaran).optional(),
    namaBankTujuan: z.string().optional(),
    nomorRekeningTujuan: z.string().optional(),
    namaEwalletTujuan: z.string().optional(),
    accountPencairanId: z.string().optional(),
    salesOrderId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Validasi metode pembayaran
    if (data.metodePencairan === "BANK_TRANSFER") {
      if (!data.namaBankTujuan || !data.nomorRekeningTujuan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Nama bank dan nomor rekening wajib diisi untuk transfer bank",
          path: ["namaBankTujuan"],
        });
      }
    } else if (data.metodePencairan === "E_WALLET") {
      if (!data.namaEwalletTujuan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama E-Wallet wajib diisi",
          path: ["namaEwalletTujuan"],
        });
      }
    }

    // Validasi status DISBURSED
    if (data.status === "DISBURSED") {
      if (!data.tanggalPencairan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal pencairan wajib diisi jika status DISBURSED",
          path: ["tanggalPencairan"],
        });
      }
      if (!data.metodePencairan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Metode pencairan wajib diisi jika status DISBURSED",
          path: ["metodePencairan"],
        });
      }
    }
  });

export const updateStatusValidation = z
  .object({
    status: z.nativeEnum(UangMukaStatus),
    tanggalPencairan: z.coerce.date().optional().nullable(),
    buktiPencairanUrl: z.string().optional(),
    metodePencairan: z.nativeEnum(MetodePembayaran).optional(),
    namaBankTujuan: z.string().optional(),
    nomorRekeningTujuan: z.string().optional(),
    namaEwalletTujuan: z.string().optional(),
    accountPencairanId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validasi status DISBURSED
    if (data.status === "DISBURSED") {
      if (!data.tanggalPencairan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal pencairan wajib diisi jika status DISBURSED",
          path: ["tanggalPencairan"],
        });
      }
      if (!data.metodePencairan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Metode pencairan wajib diisi jika status DISBURSED",
          path: ["metodePencairan"],
        });
      }
    }

    // Validasi metode pembayaran
    if (data.metodePencairan === "BANK_TRANSFER") {
      if (!data.namaBankTujuan || !data.nomorRekeningTujuan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Nama bank dan nomor rekening wajib diisi untuk transfer bank",
          path: ["namaBankTujuan"],
        });
      }
    } else if (data.metodePencairan === "E_WALLET") {
      if (!data.namaEwalletTujuan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama E-Wallet wajib diisi",
          path: ["namaEwalletTujuan"],
        });
      }
    }
  });

export const uangMukaIdValidation = z.object({
  id: uuidSchema,
});

export const uangMukaQueryValidation = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional().default(""),
  status: z.nativeEnum(UangMukaStatus).optional(),
  metodePencairan: z.nativeEnum(MetodePembayaran).optional(),
  karyawanId: uuidSchema.optional(),
  spkId: uuidSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ========================
// TYPE DEFINITIONS (JSDoc)
// ========================

/** @typedef {z.infer<typeof createUangMukaValidation>} CreateUangMukaInput */
/** @typedef {z.infer<typeof updateUangMukaValidation>} UpdateUangMukaInput */
/** @typedef {z.infer<typeof updateStatusValidation>} UpdateStatusInput */
/** @typedef {z.infer<typeof uangMukaQueryValidation>} UangMukaQueryInput */
