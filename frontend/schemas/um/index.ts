import { z } from "zod";

// ========================
// ZOD ENUMS
// ========================

export const UangMukaStatus = z.enum([
  "PENDING",
  "DISBURSED",
  "SETTLED",
  "REJECTED",
]);

export const MetodePembayaran = z.enum(["CASH", "BANK_TRANSFER", "E_WALLET"]);

export type UangMukaStatus = z.infer<typeof UangMukaStatus>;
export type MetodePembayaran = z.infer<typeof MetodePembayaran>;

// ========================
// TYPE DEFINITIONS FOR VALIDATION FUNCTIONS
// ========================

interface PaymentMethodData {
  metodePencairan?: MetodePembayaran;
  namaBankTujuan?: string;
  nomorRekeningTujuan?: string;
  namaEwalletTujuan?: string;
}

interface StatusData {
  status?: UangMukaStatus;
  tanggalPencairan?: Date | null;
  metodePencairan?: MetodePembayaran;
}

// ========================
// FILE VALIDATION SCHEMAS
// ========================

// Schema untuk file validation di frontend
export const fileSchema = z
  .instanceof(File)
  .optional()
  .refine(
    (file) => {
      if (!file) return true; // Optional
      return file.size <= 5 * 1024 * 1024; // 5MB
    },
    {
      message: "File maksimal 5MB",
    }
  )
  .refine(
    (file) => {
      if (!file) return true; // Optional
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      return allowedTypes.includes(file.type);
    },
    {
      message: "File harus berupa JPEG, PNG, WebP, atau PDF",
    }
  );

// Schema untuk FormData (tanpa File instance validation)
export const fileFormDataSchema = z
  .any()
  .optional()
  .refine(
    (file) => {
      if (!file) return true; // Optional
      // Di FormData, file sudah divalidasi oleh browser
      return true;
    },
    {
      message: "File tidak valid",
    }
  );

// ========================
// HELPER SCHEMAS
// ========================

const uuidSchema = z.string().uuid({
  message: "ID harus berupa UUID yang valid",
});

const decimalSchema = z
  .number({
    required_error: "Jumlah harus diisi",
    invalid_type_error: "Jumlah harus berupa angka",
  })
  .positive({
    message: "Jumlah harus lebih besar dari 0",
  });

const optionalUrlSchema = z
  .string()
  .url({
    message: "URL tidak valid",
  })
  .optional()
  .or(z.literal(""));

const dateSchema = z.coerce.date({
  required_error: "Tanggal harus diisi",
  invalid_type_error: "Format tanggal tidak valid",
});

// Validasi rekening bank
const nomorRekeningSchema = z
  .string()
  .regex(/^\d+$/, "Nomor rekening harus berupa angka")
  .min(5, "Nomor rekening minimal 5 digit")
  .max(20, "Nomor rekening maksimal 20 digit")
  .optional()
  .or(z.literal(""));

// Validasi nama e-wallet
const namaEwalletSchema = z
  .string()
  .min(3, "Nama e-wallet minimal 3 karakter")
  .max(50, "Nama e-wallet maksimal 50 karakter")
  .optional()
  .or(z.literal(""));

// ========================
// REUSABLE VALIDATION FUNCTIONS
// ========================

/**
 * Validasi kondisional untuk metode pembayaran
 */
const validatePaymentMethod = (
  data: PaymentMethodData,
  ctx: z.RefinementCtx
) => {
  if (data.metodePencairan === "BANK_TRANSFER") {
    if (!data.namaBankTujuan?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nama bank wajib diisi untuk transfer bank",
        path: ["namaBankTujuan"],
      });
    }
    if (!data.nomorRekeningTujuan?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nomor rekening wajib diisi untuk transfer bank",
        path: ["nomorRekeningTujuan"],
      });
    }
  } else if (data.metodePencairan === "E_WALLET") {
    if (!data.namaEwalletTujuan?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nama E-Wallet wajib diisi",
        path: ["namaEwalletTujuan"],
      });
    }
  }
};

/**
 * Validasi status dan tanggal pencairan
 */
const validateStatusAndDisbursement = (
  data: StatusData,
  ctx: z.RefinementCtx
) => {
  if (data.status === "DISBURSED") {
    if (!data.tanggalPencairan) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tanggal pencairan wajib diisi untuk status DISBURSED",
        path: ["tanggalPencairan"],
      });
    }
    if (!data.metodePencairan) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Metode pencairan wajib diisi untuk status DISBURSED",
        path: ["metodePencairan"],
      });
    }
  }
};

// ========================
// MAIN VALIDATION SCHEMAS
// ========================

export const createUangMukaSchema = z
  .object({
    jumlah: z.number().min(1, "Jumlah harus lebih dari 0"),
    metodePencairan: z.enum(["CASH", "BANK_TRANSFER", "E_WALLET"]),
    keterangan: z.string().optional(),
    namaBankTujuan: z.string().optional(),
    nomorRekeningTujuan: z.string().optional(),
    namaEwalletTujuan: z.string().optional(),
    purchaseRequestId: z.string().nullable().optional(),
    karyawanId: z.string().nullable().optional(),
    spkId: z.string().nullable().optional(),
    tanggalPengajuan: z.date(),
    tanggalPencairan: z.date().nullable().optional(),
    buktiPencairanUrl: z.string().optional(),
  })
  .superRefine(validatePaymentMethod);

export const updateUangMukaSchema = z
  .object({
    tanggalPengajuan: dateSchema.optional(),
    tanggalPencairan: dateSchema.optional().nullable(),
    jumlah: decimalSchema.optional(),
    keterangan: z.string().max(500).optional().default(""),
    status: UangMukaStatus.optional(),
    buktiPencairanUrl: optionalUrlSchema,

    // FIELD BARU: Metode pembayaran
    metodePencairan: MetodePembayaran.optional(),
    namaBankTujuan: z.string().max(50).optional().default(""),
    nomorRekeningTujuan: nomorRekeningSchema.default(""),
    namaEwalletTujuan: namaEwalletSchema.default(""),

    purchaseRequestId: uuidSchema.optional().nullable(),
    karyawanId: uuidSchema.optional(),
    spkId: uuidSchema.optional(),
  })
  .superRefine((data, ctx) => {
    validatePaymentMethod(data, ctx);
    validateStatusAndDisbursement(data, ctx);
  });

// Schema untuk update status DENGAN file upload (FormData)
export const updateStatusWithFileSchema = z
  .object({
    status: UangMukaStatus,
    tanggalPencairan: dateSchema.optional().nullable(),

    // FIELD BARU: Metode pembayaran (wajib jika DISBURSED)
    metodePencairan: MetodePembayaran.optional(),
    namaBankTujuan: z.string().max(50).optional().default(""),
    nomorRekeningTujuan: nomorRekeningSchema.default(""),
    namaEwalletTujuan: namaEwalletSchema.default(""),

    buktiPencairan: fileSchema, // Untuk frontend validation
  })
  .superRefine((data, ctx) => {
    validatePaymentMethod(data, ctx);
    validateStatusAndDisbursement(data, ctx);
  });

// Schema untuk FormData (digunakan saat submit) - FIXED TYPES
export const updateStatusFormDataSchema = z.object({
  status: UangMukaStatus,
  tanggalPencairan: z.string().optional().nullable(), // FormData selalu string

  // FIELD BARU: Metode pembayaran - convert string to enum
  metodePencairan: z
    .string()
    .optional()
    .transform((val) => val as MetodePembayaran | undefined),
  namaBankTujuan: z.string().optional().default(""),
  nomorRekeningTujuan: z.string().optional().default(""),
  namaEwalletTujuan: z.string().optional().default(""),

  buktiPencairan: fileFormDataSchema, // Accept any file dari FormData
});

// Schema untuk update status TANPA file (JSON biasa)
export const updateStatusSchema = z
  .object({
    status: UangMukaStatus,
    tanggalPencairan: dateSchema.optional().nullable(),

    // FIELD BARU: Metode pembayaran
    metodePencairan: MetodePembayaran.optional(),
    namaBankTujuan: z.string().max(50).optional().default(""),
    nomorRekeningTujuan: nomorRekeningSchema.default(""),
    namaEwalletTujuan: namaEwalletSchema.default(""),

    buktiPencairanUrl: optionalUrlSchema,
  })
  .superRefine((data, ctx) => {
    validatePaymentMethod(data, ctx);
    validateStatusAndDisbursement(data, ctx);
  });

export const uangMukaIdSchema = z.object({
  id: uuidSchema,
});

export const uangMukaQuerySchema = z.object({
  page: z.coerce
    .number()
    .int({
      message: "Page harus berupa bilangan bulat",
    })
    .min(1, {
      message: "Page minimal 1",
    })
    .default(1),
  limit: z.coerce
    .number()
    .int({
      message: "Limit harus berupa bilangan bulat",
    })
    .min(1, {
      message: "Limit minimal 1",
    })
    .max(100, {
      message: "Limit maksimal 100",
    })
    .default(10),
  search: z.string().optional().default(""),
  status: UangMukaStatus.optional(),
  metodePencairan: MetodePembayaran.optional(), // FIELD BARU: Filter metode pencairan
  karyawanId: uuidSchema.optional(),
  spkId: uuidSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

// ========================
// FORM SCHEMAS (Untuk React Hook Form)
// ========================

export const uangMukaFormSchema = createUangMukaSchema;
export const uangMukaEditFormSchema = updateUangMukaSchema;
export const statusUpdateFormSchema = updateStatusWithFileSchema; // Dengan file validation

// ========================
// TYPE INFERENCES
// ========================

export type CreateUangMukaInput = z.infer<typeof createUangMukaSchema>;
export type UpdateUangMukaInput = z.infer<typeof updateUangMukaSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UpdateStatusWithFileInput = z.infer<
  typeof updateStatusWithFileSchema
>;
export type UpdateStatusFormDataInput = z.infer<
  typeof updateStatusFormDataSchema
>;
export type UangMukaQueryInput = z.infer<typeof uangMukaQuerySchema>;

// ========================
// UTILITY FUNCTIONS
// ========================

/**
 * Validasi data create uang muka
 */
export const validateCreateUangMuka = (data: unknown) => {
  return createUangMukaSchema.safeParse(data);
};

/**
 * Validasi data update uang muka
 */
export const validateUpdateUangMuka = (data: unknown) => {
  return updateUangMukaSchema.safeParse(data);
};

/**
 * Validasi data update status dengan file
 */
export const validateUpdateStatusWithFile = (data: unknown) => {
  return updateStatusWithFileSchema.safeParse(data);
};

/**
 * Validasi FormData untuk update status - FIXED TYPE
 */
export const validateUpdateStatusFormData = (data: FormData) => {
  const formDataObj = formDataToObject(data);
  return updateStatusFormDataSchema.safeParse(formDataObj);
};

/**
 * Validasi query parameters
 */
export const validateUangMukaQuery = (data: unknown) => {
  return uangMukaQuerySchema.safeParse(data);
};

/**
 * Convert FormData to object (untuk file upload) - FIXED TYPES
 */
export const formDataToObject = (
  formData: FormData
): UpdateStatusFormDataInput => {
  const status = formData.get("status");
  const tanggalPencairan = formData.get("tanggalPencairan");
  const metodePencairan = formData.get("metodePencairan");
  const namaBankTujuan = formData.get("namaBankTujuan");
  const nomorRekeningTujuan = formData.get("nomorRekeningTujuan");
  const namaEwalletTujuan = formData.get("namaEwalletTujuan");
  const buktiPencairan = formData.get("buktiPencairan");

  return {
    status: status ? (status as UangMukaStatus) : "PENDING",
    tanggalPencairan: tanggalPencairan ? String(tanggalPencairan) : null,
    metodePencairan: metodePencairan
      ? (String(metodePencairan) as MetodePembayaran)
      : undefined,
    namaBankTujuan: namaBankTujuan ? String(namaBankTujuan) : "",
    nomorRekeningTujuan: nomorRekeningTujuan ? String(nomorRekeningTujuan) : "",
    namaEwalletTujuan: namaEwalletTujuan ? String(namaEwalletTujuan) : "",
    buktiPencairan: buktiPencairan as File | null,
  };
};

/**
 * Prepare FormData untuk upload
 */
export const prepareStatusUpdateFormData = (
  data: UpdateStatusWithFileInput
): FormData => {
  const formData = new FormData();

  formData.append("status", data.status);

  if (data.tanggalPencairan) {
    formData.append("tanggalPencairan", data.tanggalPencairan.toISOString());
  }

  if (data.metodePencairan) {
    formData.append("metodePencairan", data.metodePencairan);
  }

  if (data.namaBankTujuan) {
    formData.append("namaBankTujuan", data.namaBankTujuan);
  }

  if (data.nomorRekeningTujuan) {
    formData.append("nomorRekeningTujuan", data.nomorRekeningTujuan);
  }

  if (data.namaEwalletTujuan) {
    formData.append("namaEwalletTujuan", data.namaEwalletTujuan);
  }

  if (data.buktiPencairan) {
    formData.append("buktiPencairan", data.buktiPencairan);
  }

  return formData;
};

// ========================
// DEFAULT VALUES
// ========================

export const defaultCreateUangMukaValues: CreateUangMukaInput = {
  tanggalPengajuan: new Date(),
  tanggalPencairan: null,
  jumlah: 0,
  keterangan: "",
  metodePencairan: "CASH", // Default value
  namaBankTujuan: "",
  nomorRekeningTujuan: "",
  namaEwalletTujuan: "",
  purchaseRequestId: null,
  karyawanId: "",
  spkId: "",
  buktiPencairanUrl: "",
};

export const defaultUpdateStatusValues: UpdateStatusWithFileInput = {
  status: UangMukaStatus.Enum.PENDING,
  tanggalPencairan: null,
  metodePencairan: undefined,
  namaBankTujuan: "",
  nomorRekeningTujuan: "",
  namaEwalletTujuan: "",
  buktiPencairan: undefined,
};

// ========================
// STATUS CONFIGURATION
// ========================

export const uangMukaStatusConfig = {
  [UangMukaStatus.Enum.PENDING]: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    description: "Menunggu pencairan",
  },
  [UangMukaStatus.Enum.DISBURSED]: {
    label: "Dicairkan",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    description: "Dana sudah dicairkan",
  },
  [UangMukaStatus.Enum.SETTLED]: {
    label: "Selesai",
    color: "bg-green-100 text-green-800 border-green-300",
    description: "Sudah dipertanggungjawabkan",
  },
  [UangMukaStatus.Enum.REJECTED]: {
    label: "Ditolak",
    color: "bg-red-100 text-red-800 border-red-300",
    description: "Pengajuan ditolak",
  },
} as const;

// ========================
// METODE PEMBAYARAN CONFIGURATION
// ========================

export const metodePembayaranConfig = {
  [MetodePembayaran.Enum.CASH]: {
    label: "Tunai",
    description: "Pembayaran secara tunai",
    icon: "💰",
  },
  [MetodePembayaran.Enum.BANK_TRANSFER]: {
    label: "Transfer Bank",
    description: "Transfer melalui bank",
    icon: "🏦",
  },
  [MetodePembayaran.Enum.E_WALLET]: {
    label: "E-Wallet",
    description: "Pembayaran digital",
    icon: "📱",
  },
} as const;

export const getStatusConfig = (status: UangMukaStatus) => {
  return uangMukaStatusConfig[status];
};

export const getMetodePembayaranConfig = (metode: MetodePembayaran) => {
  return metodePembayaranConfig[metode];
};

export const uangMukaStatusOptions = Object.entries(uangMukaStatusConfig).map(
  ([value, config]) => ({
    value: value as UangMukaStatus,
    label: config.label,
    color: config.color,
  })
);

export const metodePembayaranOptions = Object.entries(
  metodePembayaranConfig
).map(([value, config]) => ({
  value: value as MetodePembayaran,
  label: config.label,
  description: config.description,
  icon: config.icon,
}));

// ========================
// PAYMENT METHOD UTILITIES
// ========================

/**
 * Check if bank fields are required based on payment method
 */
export const requiresBankFields = (
  metodePencairan?: MetodePembayaran
): boolean => {
  return metodePencairan === "BANK_TRANSFER";
};

/**
 * Check if e-wallet fields are required based on payment method
 */
export const requiresEwalletFields = (
  metodePencairan?: MetodePembayaran
): boolean => {
  return metodePencairan === "E_WALLET";
};

/**
 * Get required fields based on payment method
 */
export const getRequiredPaymentFields = (
  metodePencairan?: MetodePembayaran
): string[] => {
  if (metodePencairan === "BANK_TRANSFER") {
    return ["namaBankTujuan", "nomorRekeningTujuan"];
  }
  if (metodePencairan === "E_WALLET") {
    return ["namaEwalletTujuan"];
  }
  return [];
};
