import { z } from "zod";

const statusEnum = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

// 1. Schema dasar untuk Create
export const createSupplierSchema = z.object({
  name: z
    .string({
      required_error: "Nama supplier wajib diisi",
      invalid_type_error: "Nama harus berupa text",
    })
    .min(3, "Nama supplier minimal 3 karakter"),

  email: z
    .string({
      required_error: "Email wajib diisi",
    })
    .email("Format email tidak valid"),

  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .max(15, "Nomor telepon maksimal 15 digit")
    .optional(), // Boleh kosong

  address: z.string().optional(),

  city: z.string().optional(),

  taxId: z.string().optional(),

  // Validasi status hanya menerima "ACTIVE", "INACTIVE", atau "SUSPENDED"
  // Default ke ACTIVE jika tidak diisi
  status: z.enum(statusEnum).default("ACTIVE"),
});

// 2. Schema untuk Update
// Menggunakan .partial() membuat semua field di atas menjadi opsional otomatis
// Jadi user bisa hanya update "address" saja tanpa kirim "email"
export const updateSupplierSchema = createSupplierSchema.partial();

// 3. Schema untuk validasi ID (misal di params url: /supplier/:id)
export const supplierIdSchema = z.object({
  id: z.string().uuid("ID harus berformat UUID valid"),
  // Ganti .uuid() dengan .regex(/^\d+$/) jika ID anda berupa angka (integer)
});

// ==================== Schema Definition ====================
export const SupplierSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Supplier Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  npwp: z.string().optional(),

  // PERBAIKAN 1: Ganti .default(false) dengan .optional()
  isTaxable: z.boolean().optional(),

  termOfPaymentId: z.string().optional(),
  supplierCategoryId: z.string().optional(),

  contacts: z
    .array(
      z.object({
        name: z.string().min(1, "Contact name is required"),
        position: z.string().optional(),
        email: z.string().email("Invalid email").optional().or(z.literal("")),
        phone: z.string().optional(),

        // PERBAIKAN 2: Ganti .default(false) dengan .optional()
        isPrimary: z.boolean().optional(),
      })
    )
    .optional(),

  bankAccounts: z
    .array(
      z.object({
        bankName: z.string().min(1, "Bank name is required"),
        accountHolderName: z.string().min(1, "Holder name is required"),
        accountNumber: z.string().min(1, "Account number is required"),
        branch: z.string().optional(),

        // PERBAIKAN 3: Ganti .default(false) dengan .optional()
        isPrimary: z.boolean().optional(),
      })
    )
    .optional(),
});
