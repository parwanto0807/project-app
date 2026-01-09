import { z } from "zod";
import {
  CoaType,
  CoaNormalBalance,
  CoaPostingType,
  CoaCashflowType,
  CoaStatus,
  ChartOfAccountsWithRelations,
} from "@/types/coa";

// Base COA Schema - PERBAIKAN: sesuaikan dengan type CoaFormData
export const coaSchema = z.object({
  code: z
    .string()
    .nonempty("Kode COA wajib diisi")
    .min(1, "Kode COA minimal 1 karakter")
    .max(1000, "Kode COA maksimal 1000 karakter")
    .regex(
      /^[A-Z0-9-]+$/,
      "Kode COA hanya boleh berisi huruf kapital, angka, dan strip"
    ),

  name: z
    .string()
    .min(2, "Nama COA harus minimal 2 karakter")
    .max(100, "Nama COA maksimal 100 karakter"),

  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional()
    .or(z.literal(""))
    .default(""),

  type: z.nativeEnum(CoaType, {
    errorMap: () => ({ message: "Tipe COA harus dipilih" }),
  }),

  normalBalance: z.nativeEnum(CoaNormalBalance, {
    errorMap: () => ({ message: "Saldo normal harus dipilih" }),
  }),

  postingType: z.nativeEnum(CoaPostingType).default(CoaPostingType.POSTING),

  cashflowType: z.nativeEnum(CoaCashflowType).default(CoaCashflowType.NONE),

  status: z.nativeEnum(CoaStatus).default(CoaStatus.ACTIVE),

  isReconcilable: z.boolean().default(false),

  defaultCurrency: z.string().default("IDR"),

  // PERBAIKAN: Support null values untuk clear parent/tax rate
  parentId: z
    .union([z.string().uuid("Parent ID tidak valid"), z.literal(""), z.null()])
    .optional()
    .default(null),

  taxRateId: z
    .union([
      z.string().uuid("Tax Rate ID tidak valid"),
      z.literal(""),
      z.null(),
    ])
    .optional()
    .default(null),
});

// Schema untuk Create COA dengan validasi bisnis
export const createCoaSchema = coaSchema.superRefine((data, ctx) => {
  // Validasi normal balance berdasarkan type
  const debitAccounts = [CoaType.ASET, CoaType.BEBAN, CoaType.HPP];
  const creditAccounts = [
    CoaType.LIABILITAS,
    CoaType.EKUITAS,
    CoaType.PENDAPATAN,
  ];

  if (
    debitAccounts.includes(data.type) &&
    data.normalBalance !== CoaNormalBalance.DEBIT
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Akun ${data.type} harus memiliki saldo normal DEBIT`,
      path: ["normalBalance"],
    });
  }

  if (
    creditAccounts.includes(data.type) &&
    data.normalBalance !== CoaNormalBalance.CREDIT
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Akun ${data.type} harus memiliki saldo normal CREDIT`,
      path: ["normalBalance"],
    });
  }

  // HEADER accounts cannot be reconcilable
  if (data.postingType === CoaPostingType.HEADER && data.isReconcilable) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Akun HEADER tidak bisa direkonsiliasi",
      path: ["isReconcilable"],
    });
  }

  // Validasi tambahan: HEADER accounts harus memiliki children capability
  if (data.postingType === CoaPostingType.HEADER) {
    // Bisa tambahkan validasi khusus untuk header accounts
  }
});

// Schema untuk Update COA (semua field optional kecuali validasi bisnis)
export const updateCoaSchema = coaSchema
  .partial()
  .extend({
    // Pastikan ID required untuk update
    id: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    // Validasi normal balance jika kedua field diisi
    if (data.type && data.normalBalance) {
      const debitAccounts = [CoaType.ASET, CoaType.BEBAN, CoaType.HPP];
      const creditAccounts = [
        CoaType.LIABILITAS,
        CoaType.EKUITAS,
        CoaType.PENDAPATAN,
      ];

      if (
        debitAccounts.includes(data.type) &&
        data.normalBalance !== CoaNormalBalance.DEBIT
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Akun ${data.type} harus memiliki saldo normal DEBIT`,
          path: ["normalBalance"],
        });
      }

      if (
        creditAccounts.includes(data.type) &&
        data.normalBalance !== CoaNormalBalance.CREDIT
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Akun ${data.type} harus memiliki saldo normal CREDIT`,
          path: ["normalBalance"],
        });
      }
    }

    // HEADER accounts cannot be reconcilable
    if (data.postingType === CoaPostingType.HEADER && data.isReconcilable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Akun HEADER tidak bisa direkonsiliasi",
        path: ["isReconcilable"],
      });
    }

    // Validasi: Tidak bisa mengubah postingType dari POSTING ke HEADER jika sudah ada journal entries
    // (Ini akan dihandle di backend, tapi bisa ditambahkan validasi client-side jika needed)
  });

// Schema untuk filter COA - PERBAIKAN: tambahkan field baru
export const coaFilterSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(1000).default(10),
  search: z.string().optional(),
  type: z.nativeEnum(CoaType).optional(),
  status: z.nativeEnum(CoaStatus).optional(),
  postingType: z.nativeEnum(CoaPostingType).optional(),
  normalBalance: z.nativeEnum(CoaNormalBalance).optional(),
  cashflowType: z.nativeEnum(CoaCashflowType).optional(),
  isReconcilable: z.boolean().optional(),
  parentId: z.string().uuid().optional(),
});

// Schema untuk COA deletion check
export const coaDeletionCheckSchema = z.object({
  id: z.string().uuid("COA ID tidak valid"),
});

// Schema untuk bulk operations
export const coaBulkOperationSchema = z.object({
  ids: z.array(z.string().uuid("ID tidak valid")).min(1, "Pilih minimal 1 COA"),
});

// Schema untuk COA search
export const coaSearchSchema = z.object({
  search: z.string().min(1, "Kata pencarian harus diisi"),
  limit: z.number().min(1).max(50).default(10),
});

// Schema untuk COA hierarchy
export const coaHierarchySchema = z.object({
  type: z.nativeEnum(CoaType).optional(),
  includeInactive: z.boolean().default(false),
});

// Schema untuk COA statistics
export const coaStatisticsSchema = z.object({
  includeInactive: z.boolean().default(false),
});

// Export types dari schema
export type CoaFormData = z.infer<typeof coaSchema>;
export type CreateCoaInput = z.infer<typeof createCoaSchema>;
export type UpdateCoaInput = z.infer<typeof updateCoaSchema>;
export type CoaFilterInput = z.infer<typeof coaFilterSchema>;
export type CoaDeletionCheckInput = z.infer<typeof coaDeletionCheckSchema>;
export type CoaBulkOperationInput = z.infer<typeof coaBulkOperationSchema>;
export type CoaSearchInput = z.infer<typeof coaSearchSchema>;
export type CoaHierarchyInput = z.infer<typeof coaHierarchySchema>;
export type CoaStatisticsInput = z.infer<typeof coaStatisticsSchema>;

// Option lists untuk form - TAMBAHAN: dengan value yang lebih user-friendly
export const coaTypeOptions: Array<{
  value: CoaType;
  label: string;
  description: string;
}> = [
    {
      value: CoaType.ASET,
      label: "Aset",
      description: "Sumber daya yang dimiliki perusahaan",
    },
    {
      value: CoaType.LIABILITAS,
      label: "Liabilitas",
      description: "Kewajiban perusahaan kepada pihak lain",
    },
    {
      value: CoaType.EKUITAS,
      label: "Ekuitas",
      description: "Hak pemilik atas aset perusahaan",
    },
    {
      value: CoaType.PENDAPATAN,
      label: "Pendapatan",
      description: "Penghasilan dari aktivitas operasional",
    },
    {
      value: CoaType.HPP,
      label: "HPP",
      description: "Harga Pokok Penjualan",
    },
    {
      value: CoaType.BEBAN,
      label: "Beban",
      description: "Pengeluaran untuk operasional perusahaan",
    },
  ];

export const normalBalanceOptions: Array<{
  value: CoaNormalBalance;
  label: string;
  description: string;
}> = [
    {
      value: CoaNormalBalance.DEBIT,
      label: "Debit",
      description: "Peningkatan untuk Aset, Beban, HPP",
    },
    {
      value: CoaNormalBalance.CREDIT,
      label: "Kredit",
      description: "Peningkatan untuk Liabilitas, Ekuitas, Pendapatan",
    },
  ];

export const postingTypeOptions: Array<{
  value: CoaPostingType;
  label: string;
  description: string;
}> = [
    {
      value: CoaPostingType.HEADER,
      label: "Header",
      description: "Akun group untuk pengelompokan (tidak bisa transaksi)",
    },
    {
      value: CoaPostingType.POSTING,
      label: "Posting",
      description: "Akun detail yang bisa menerima transaksi",
    },
  ];

export const cashflowTypeOptions: Array<{
  value: CoaCashflowType;
  label: string;
  description: string;
}> = [
    {
      value: CoaCashflowType.OPERASIONAL,
      label: "Operasi",
      description: "Aktivitas operasional utama perusahaan",
    },
    {
      value: CoaCashflowType.INVESTASI,
      label: "Investasi",
      description: "Aktivitas investasi aset tetap",
    },
    {
      value: CoaCashflowType.PENDANAAN,
      label: "Pendanaan",
      description: "Aktivitas pendanaan dan pembayaran dividen",
    },
    {
      value: CoaCashflowType.NONE,
      label: "Tidak Termasuk",
      description: "Tidak masuk dalam laporan arus kas",
    },
  ];

export const statusOptions: Array<{
  value: CoaStatus;
  label: string;
  description: string;
}> = [
    {
      value: CoaStatus.ACTIVE,
      label: "Aktif",
      description: "Akun dapat digunakan untuk transaksi",
    },
    {
      value: CoaStatus.INACTIVE,
      label: "Non-Aktif",
      description: "Akun tidak dapat digunakan sementara",
    },
    {
      value: CoaStatus.LOCKED,
      label: "Terkunci",
      description: "Akun dikunci (misal: saat audit)",
    },
  ];

// Utility functions untuk schema
export const coaSchemaUtils = {
  // Generate default values untuk form
  getDefaultValues(): CoaFormData {
    return {
      code: "",
      name: "",
      description: "",
      type: CoaType.ASET,
      normalBalance: CoaNormalBalance.DEBIT,
      postingType: CoaPostingType.POSTING,
      cashflowType: CoaCashflowType.NONE,
      status: CoaStatus.ACTIVE,
      isReconcilable: false,
      defaultCurrency: "IDR",
      parentId: null,
      taxRateId: null,
    };
  },

  // Transform API data ke form data
  // Transform API data ke form data
  transformToFormData(coa: Partial<ChartOfAccountsWithRelations>): CoaFormData {
    return {
      code: coa.code || "",
      name: coa.name || "",
      description: coa.description || "",
      type: coa.type || CoaType.ASET,
      normalBalance: coa.normalBalance || CoaNormalBalance.DEBIT,
      postingType: coa.postingType || CoaPostingType.POSTING,
      cashflowType: coa.cashflowType || CoaCashflowType.NONE,
      status: coa.status || CoaStatus.ACTIVE,
      isReconcilable: coa.isReconcilable || false,
      defaultCurrency: coa.defaultCurrency || "IDR",
      parentId: coa.parentId || null,
      taxRateId: coa.taxRateId || null,
    };
  },
  // Validate COA code format
  isValidCode(code: string): boolean {
    return /^[A-Z0-9.-]+$/.test(code);
  },

  // Suggest next code berdasarkan parent
  suggestNextCode(parentCode?: string, siblings: string[] = []): string {
    if (!parentCode) {
      // Jika tidak ada parent, cari angka berikutnya dari 1000
      const rootCodes = siblings.filter((code) => !code.includes("."));
      if (rootCodes.length === 0) return "1000";

      const lastRoot = Math.max(
        ...rootCodes.map((code) => parseInt(code) || 0)
      );
      return (lastRoot + 1).toString();
    }

    // Jika ada parent, cari angka berikutnya dengan format parent.XXX
    const childCodes = siblings
      .filter((code) => code.startsWith(parentCode + "."))
      .map((code) => {
        const parts = code.split(".");
        return parseInt(parts[parts.length - 1]) || 0;
      });

    if (childCodes.length === 0) return `${parentCode}.001`;

    const nextNumber = Math.max(...childCodes) + 1;
    return `${parentCode}.${nextNumber.toString().padStart(3, "0")}`;
  },
};
