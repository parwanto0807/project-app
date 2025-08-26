import { z } from "zod";
import { ProductType } from "@/constans/product-type";

export const UserSchema = z.object({
  username: z.string().min(1, { message: "Username wajib diisi" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  role: z.enum(["user", "admin"]).optional().default("user"),
});

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

export const ApiCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const ApiProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const ApiProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
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

/* ===== ENUMS ===== */
export const OrderTypeEnum = z.enum(["REGULAR", "SUPPORT"]);
export const OrderStatusEnum = z.enum([
  "DRAFT",
  "SENT",
  "CONFIRMED",
  "IN_PROGRESS",
  "FULFILLED",
  "PARTIALLY_INVOICED",
  "INVOICED",
  "PARTIALLY_PAID",
  "PAID",
  "CANCELLED",
]);
export const ItemTypeEnum = z.enum(["PRODUCT", "SERVICE", "CUSTOM"]);
export const DocTypeEnum = z.enum([
  "QUOTATION",
  "PO",
  "BAP",
  "INVOICE",
  "PAYMENT_RECEIPT",
]);

/* ===== Util presisi (pakai epsilon) ===== */
const EPS = 1e-9;
const maxDp = (n: number, dp: number) => {
  if (!Number.isFinite(n)) return false;
  const scaled = n * 10 ** dp;
  return Math.abs(Math.round(scaled) - scaled) < EPS;
};

/* ====================================================================== */
/* ======================  ITEM  (BASE + RULES)  ======================== */
/* ====================================================================== */

/* BASE: pure object tanpa rules lintas-field */
export const salesOrderItemBase = z.object({
  itemType: ItemTypeEnum.default("PRODUCT"),

  // productId: optional di base; aturan wajib/null di superRefine
  productId: z.string().uuid().optional().nullable(),

  name: z.string().trim().min(1, "Nama item wajib diisi."),
  description: z.string().trim().optional().nullable(),

  uom: z.string().trim().max(20, "UOM maksimal 20 karakter.").optional().nullable(),

  qty: z.coerce
    .number()
    .positive("Kuantitas harus > 0.")
    .refine((v) => Number.isFinite(v), "qty harus angka.")
    .refine((v) => maxDp(v, 4), "qty maksimal 4 angka desimal."),

  unitPrice: z.coerce
    .number()
    .min(0, "Harga tidak boleh negatif.")
    .refine((v) => Number.isFinite(v), "unitPrice harus angka.")
    .refine((v) => maxDp(v, 2), "unitPrice maksimal 2 angka desimal."),

  // Diskon & pajak dalam persen (0..100)
  discount: z.coerce
    .number()
    .min(0, "Discount tidak boleh negatif.")
    .max(100, "Discount tidak boleh lebih dari 100%.")
    .default(0)
    .refine((v) => Number.isFinite(v), "discount harus angka.")
    .refine((v) => maxDp(v, 2), "discount maksimal 2 angka desimal."),

  taxRate: z.coerce
    .number()
    .min(0, "Tax rate tidak boleh negatif.")
    .max(100, "Tax rate tidak boleh lebih dari 100%.")
    .default(0)
    .refine((v) => Number.isFinite(v), "taxRate harus angka.")
    .refine((v) => maxDp(v, 2), "taxRate maksimal 2 angka desimal."),

  // Posisi sisip baris opsional
  insertAt: z.coerce.number().int().positive().optional(),
});

export type SalesOrderItemBase = z.infer<typeof salesOrderItemBase>;

/* Lintas-field rules */
const validateItemBusinessRules = (val: SalesOrderItemBase, ctx: z.RefinementCtx) => {
  // PRODUCT & SERVICE: productId wajib
  if ((val.itemType === "PRODUCT" || val.itemType === "SERVICE") && !val.productId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["productId"],
      message: "Pilih product/jasa dari katalog untuk item PRODUCT/SERVICE.",
    });
  }

  // CUSTOM: productId harus kosong
  if (val.itemType === "CUSTOM" && val.productId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["productId"],
      message: "Untuk item CUSTOM, kosongkan productId.",
    });
  }

  // Guard tambahan untuk persen (schema sudah membatasi)
  if (val.discount < 0 || val.discount > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discount"],
      message: "Diskon (%) harus 0–100.",
    });
  }
  if (val.taxRate < 0 || val.taxRate > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["taxRate"],
      message: "Pajak (%) harus 0–100.",
    });
  }
};

/* CREATE item */
export const salesOrderItemSchema = salesOrderItemBase.superRefine(validateItemBusinessRules);

/* UPDATE item (PATCH) */
export const salesOrderItemUpdateSchema = salesOrderItemBase
  .extend({
    id: z.string().uuid().optional().nullable(),     // null ⇒ item baru saat PATCH
    lineNo: z.coerce.number().int().positive().optional(), // pindah posisi baris
  })
  .superRefine(validateItemBusinessRules);

/* RESPONSE item (dari backend) */
export const salesOrderItemWithIdSchema = salesOrderItemBase
  .extend({
    id: z.string().uuid(),
    salesOrderId: z.string().uuid().optional(),
    lineNo: z.coerce.number().int().positive(),
    lineTotal: z.coerce.number().default(0),
    product: z.any().optional(),
  })
  .superRefine(validateItemBusinessRules);

/* ====================================================================== */
/* =======================  DOCUMENT (opsional)  ======================== */
/* ====================================================================== */

export const salesOrderDocumentSchema = z.object({
  docType: DocTypeEnum,
  docNumber: z.string().optional().nullable(),
  docDate: z.coerce.date().optional().nullable(),
  fileUrl: z.string().url().optional().nullable(),
  meta: z.any().optional().nullable(),
});

const salesOrderDocumentWithIdSchema = salesOrderDocumentSchema.extend({
  id: z.string().uuid(),
  salesOrderId: z.string().uuid().optional(),
  createdAt: z.coerce.date().optional(),
});

/* ====================================================================== */
/* ===========================  CREATE SO  ============================== */
/* ====================================================================== */

export const createSalesOrderSchema = z.object({
  soNumber: z.string().optional(),
  soDate: z.coerce.date({ required_error: "Tanggal wajib diisi." }),

  customerId: z.string().uuid({ message: "Customer wajib dipilih." }),
  // Project opsional & nullable (boleh tidak ada)
  projectId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid({ message: "User wajib dipilih." }),

  type: OrderTypeEnum,
  status: OrderStatusEnum.default("DRAFT"),

  currency: z.string().default("IDR"),
  isTaxInclusive: z.boolean().optional().default(false),

  notes: z.string().optional().nullable(),

  items: z.array(salesOrderItemSchema).min(1, "Minimal harus ada satu item."),
  documents: z.array(salesOrderDocumentSchema).optional(),
});
export type CreateSalesOrderPayload = z.infer<typeof createSalesOrderSchema>;

/* ====================================================================== */
/* ============================  UPDATE SO  ============================= */
/* ====================================================================== */

export const salesOrderUpdateSchema = z.object({
  soNumber: z.string().optional(),
  soDate: z.coerce.date().optional(),

  customerId: z.string().uuid().optional(),
  // Izinkan null untuk menghapus project saat update
  projectId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional(),

  type: OrderTypeEnum.optional(),          // PATCH ⇒ opsional
  status: OrderStatusEnum.optional(),

  currency: z.string().optional(),
  isTaxInclusive: z.boolean().optional(),

  notes: z.string().optional().nullable(),

  items: z
    .array(salesOrderItemUpdateSchema)
    .min(1, "Jika daftar item disertakan, minimal harus ada satu item.")
    .optional(),

  documents: z.array(salesOrderDocumentSchema).optional(),
});
export type UpdateSalesOrderPayload = z.infer<typeof salesOrderUpdateSchema>;

/* ====================================================================== */
/* ============================  FULL SO  =============================== */
/* ====================================================================== */

export const fullSalesOrderSchema = z.object({
  id: z.string().uuid(),
  soNumber: z.string(),
  soDate: z.coerce.date(),

  customerId: z.string().uuid(),
  // Project tidak selalu ada ⇒ opsional + nullable
  projectId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid(),

  type: OrderTypeEnum,
  status: OrderStatusEnum,

  isTaxInclusive: z.boolean(),

  currency: z.string(),

  // Angka dari Prisma.Decimal ⇒ coerce ke number
  subtotal: z.coerce.number(),
  discountTotal: z.coerce.number(),
  taxTotal: z.coerce.number(),
  grandTotal: z.coerce.number(),

  notes: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),

  items: z.array(salesOrderItemWithIdSchema).min(1),
  documents: z.array(salesOrderDocumentWithIdSchema).optional(),

  // relasi (display)
  customer: z.any().optional(),
  project: z.any().optional(),
  user: z.any().optional(),
});
export type SalesOrder = z.infer<typeof fullSalesOrderSchema>;

/* ===== Bentuk untuk display di form (opsional) ===== */
export type SalesOrderWithRelations = SalesOrder & {
  customer?: { id: string; name: string };
  project?: { id: string; name: string };
  user?: { id: string; name: string };
};

export type SalesOrderFormValues = CreateSalesOrderPayload & {
  id?: string;
  customerName?: string;
  projectName?: string;
};