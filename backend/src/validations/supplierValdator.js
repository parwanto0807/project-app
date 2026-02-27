import { z } from 'zod';

// ==========================================
// 1. Definisikan Schema Validasi dengan Zod
// ==========================================
export const supplierSchema = z.object({
  code: z
    .string({ required_error: "Kode Supplier wajib diisi" })
    .min(3, "Kode minimal 3 karakter")
    .trim(),

  name: z
    .string({ required_error: "Nama Supplier wajib diisi" })
    .min(3, "Nama minimal 3 karakter")
    .trim(),

  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal('')), // Membolehkan string kosong "" atau null/undefined

  phone: z.string().optional().or(z.literal('')),
  
  website: z.string().url("Format URL tidak valid").optional().or(z.literal('')),

  npwp: z.string().optional().or(z.literal('')),

  // Menggunakan z.coerce untuk mengubah string "true"/"false" menjadi boolean otomatis
  isTaxable: z.coerce.boolean().optional().default(false),

  // Validasi Mata Uang (Default IDR, max 3 chars)
  currency: z.string().length(3, "Mata uang harus 3 karakter (cth: IDR)").default("IDR"),

  // Validasi Angka (Credit Limit) - Coerce mengubah string angka menjadi number
  creditLimit: z.coerce
    .number({ invalid_type_error: "Credit Limit harus berupa angka" })
    .nonnegative("Credit limit tidak boleh negatif")
    .optional(),

  // Validasi UUID untuk Relasi (Foreign Keys)
  termOfPaymentId: z
    .string()
    .uuid("Term Of Payment ID tidak valid")
    .optional()
    .or(z.literal('')),

  supplierCategoryId: z
    .string()
    .uuid("Supplier Category ID tidak valid")
    .optional()
    .or(z.literal('')),

  // Validasi Nested Array (Kontak) - Opsional
  contacts: z.array(
    z.object({
      name: z.string().min(1, "Nama kontak wajib diisi"),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional(),
      position: z.string().optional(),
      isPrimary: z.coerce.boolean().optional()
    })
  ).optional(),

  // Validasi Nested Array (Bank) - Opsional
  bankAccounts: z.array(
    z.object({
      bankName: z.string().min(1, "Nama Bank wajib diisi"),
      accountNumber: z.string().min(1, "Nomor Rekening wajib diisi"),
      accountHolderName: z.string().min(1, "Nama Pemilik Rekening wajib diisi"),
      branch: z.string().optional(),
    })
  ).optional(),
});


// ==========================================
// 2. Middleware Validasi Express
// ==========================================
export const validateSupplier = (req, res, next) => {
  try {
    // parse() akan melempar error jika validasi gagal
    // parse() juga membersihkan data (strip unknown keys jika di-set strict, tapi default zod pass through)
    // Kita gunakan safeParse jika ingin handle manual, atau try-catch blok
    
    const validatedData = supplierSchema.parse(req.body);
    
    // Ganti req.body dengan data yang sudah divalidasi & dibersihkan (opsional)
    req.body = validatedData; 
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format error Zod agar lebih mudah dibaca Frontend
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'), // misal: "contacts.0.email"
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validasi Gagal",
        errors: formattedErrors,
      });
    }

    // Error lain
    return res.status(500).json({
      success: false,
      message: "Internal Server Error saat validasi",
    });
  }
};
