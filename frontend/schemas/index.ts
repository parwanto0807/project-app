import { z } from "zod";
import { ProductType } from "@/constans/product-type";

export const UserSchema = z.object({
  username: z.string().min(1, { message: "Username wajib diisi" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  role: z.enum(["user", "admin"]).optional().default("user"),
});

// Contoh: Schema untuk login (hanya membutuhkan username dan password)
// In your schemas file
export const LoginSchema = z.object({
  email: z.string().email({ message: "Email wajib diisi" }),
  password: z.string().min(1, { message: "Password wajib diisi" }),
});

export const RegisterSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const RegisterSchemaEmail = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
  role: z.enum(["admin", "pic", "warga"], {
    required_error: "Role wajib dipilih",
  }),
});

export const customerSchema = z.object({
  code: z.string().min(1, { message: "Customer code is required" }),
  name: z.string().min(1, { message: "Customer name is required" }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^[0-9]*$/, { message: "Phone number must contain only digits" })
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(200, { message: "Address too long" })
    .optional()
    .or(z.literal("")),
  branch: z.string().max(50).optional().or(z.literal("")),
  city: z.string().max(50).optional().or(z.literal("")),
  province: z.string().max(50).optional().or(z.literal("")),
  postalCode: z.string().max(10).optional().or(z.literal("")),
  taxNumber: z.string().max(30).optional().or(z.literal("")),
  companyType: z.string().max(30).optional().or(z.literal("")),
  contactPerson: z.string().max(50).optional().or(z.literal("")),
  picPhone: z
    .string()
    .regex(/^[0-9]*$/, { message: "Phone number must contain only digits" })
    .optional()
    .or(z.literal("")),
  picEmail: z
    .string()
    .email({ message: "Invalid email address" })
    .optional()
    .or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  isActive: z.boolean(),
});

// Untuk update: tambah id UUID
export const customerUpdateSchema = customerSchema.extend({
  id: z.string().uuid({ message: "Invalid customer ID" }),
});

export type LoginSchemaType = z.infer<typeof LoginSchema>;

export const ProductRegisterSchema = z.object({
  code: z.string().min(1, { message: "Kode produk wajib diisi" }),
  name: z.string().min(1, { message: "Nama produk wajib diisi" }),
  description: z.string().optional(),
  type: z.nativeEnum(ProductType).optional(),

  purchaseUnit: z.string().min(1, { message: "Satuan pembelian wajib diisi" }),
  storageUnit: z.string().min(1, { message: "Satuan penyimpanan wajib diisi" }),
  usageUnit: z.string().min(1, { message: "Satuan penggunaan wajib diisi" }),

  conversionToStorage: z.coerce
    .number()
    .positive({ message: "Harus lebih dari 0" }),
  conversionToUsage: z.coerce
    .number()
    .positive({ message: "Harus lebih dari 0" }),

  isConsumable: z.boolean(),
  isActive: z.boolean(),

  image: z.any().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().uuid().optional(),
});

// Untuk update: semua field optional + id wajib
export const ProductUpdateSchema = ProductRegisterSchema.partial().extend({
  id: z.string().uuid({ message: "ID produk tidak valid" }),
});

//Product Category Model
export const ProductCategoryRegisterSchema = z.object({
  name: z.string().min(1, { message: "Nama kategori wajib diisi" }),
});
export const ProductCategoryUpdateSchema = ProductCategoryRegisterSchema.extend(
  {
    id: z.string().uuid({ message: "ID kategori tidak valid" }),
  }
);
